package dev.akumano.asciiazur;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.res.Configuration;
import android.net.Uri;
import android.os.Bundle;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.JsResult;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.webkit.WebViewAssetLoader;
import java.io.ByteArrayInputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import org.json.JSONTokener;

/** Offline native package of the exact web game; no game rules or saves duplicated. */
public final class MainActivity extends Activity {
    private static final String ORIGIN = "https://appassets.androidplatform.net";
    private static final String ENTRY = ORIGIN + "/assets/index.html";
    private static final int OPEN_JSON = 104;
    private static final int SAVE_JSON = 105;
    private static final int MAX_EXPORT_BYTES = 1_000_000;
    private WebView game;
    private ValueCallback<Uri[]> fileSelection;
    private byte[] exportBytes;
    private final Handler main = new Handler(Looper.getMainLooper());

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
            .build();
        game = new WebView(this);
        game.setBackgroundColor(0xff080d15);
        game.setOverScrollMode(View.OVER_SCROLL_NEVER);
        WebSettings settings = game.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        // Required for a user-approved Storage Access Framework content:// URI.
        // All WebView subresources remain restricted by shouldInterceptRequest.
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setSupportMultipleWindows(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        game.addJavascriptInterface(new JsonExportBridge(), "AzNative");
        game.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (isBundled(uri)) return loader.shouldInterceptRequest(uri);
                return denied();
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (isBundled(uri)) return false;
                // No arbitrary remote content is ever rendered with native JS bridges.
                if (request.isForMainFrame() && ("https".equals(uri.getScheme()) || "http".equals(uri.getScheme()))) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); } catch (ActivityNotFoundException ignored) {}
                }
                return true;
            }
            @Override public void onPageFinished(WebView view, String url) {
                if (BuildConfig.DEBUG) Log.i("AZUR_NATIVE", "PAGE_FINISHED " + (ENTRY.equals(url) ? "TRUSTED" : "OTHER"));
            }
        });
        game.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onJsConfirm(WebView view, String url, String message, JsResult result) {
                // Never display trusted app prompts for external or navigated content.
                if (!ENTRY.equals(url) || game == null || isFinishing()) {
                    result.cancel();
                    return true;
                }
                new AlertDialog.Builder(MainActivity.this)
                    .setTitle(R.string.app_name)
                    .setMessage(message)
                    .setPositiveButton("Continuar", (dialog, which) -> result.confirm())
                    .setNegativeButton("Cancelar", (dialog, which) -> result.cancel())
                    .setOnCancelListener(dialog -> result.cancel())
                    .show();
                return true;
            }
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileSelection != null) fileSelection.onReceiveValue(null);
                fileSelection = callback;
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("application/json");
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                try { startActivityForResult(intent, OPEN_JSON); }
                catch (ActivityNotFoundException error) {
                    fileSelection.onReceiveValue(null); fileSelection = null;
                }
                return true;
            }
        });
        setContentView(game);
        game.loadUrl(ENTRY);
    }
    private static boolean isBundled(Uri uri) {
        return "https".equals(uri.getScheme())
            && "appassets.androidplatform.net".equals(uri.getHost())
            && (uri.getPort() == -1 || uri.getPort() == 443)
            && uri.getPath() != null && uri.getPath().startsWith("/assets/");
    }
    private static WebResourceResponse denied() {
        return new WebResourceResponse("text/plain", "UTF-8", 403, "Forbidden",
            java.util.Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
    }
    /** Calls are accepted only while this Activity hosts its trusted bundled page. */
    public final class JsonExportBridge {
        @JavascriptInterface public void exportJson(String name, String json) {
            if (name == null || json == null || json.length() > MAX_EXPORT_BYTES
                || !name.matches("ascii-azur-[a-zA-Z0-9_-]{1,48}\\.json")) return;
            try {
                if (!(new JSONTokener(json).nextValue() instanceof org.json.JSONObject)) return;
            } catch (Exception invalid) { return; }
            final byte[] data = json.getBytes(StandardCharsets.UTF_8);
            if (data.length > MAX_EXPORT_BYTES) return;
            main.post(() -> {
                if (game == null || !ENTRY.equals(game.getUrl()) || exportBytes != null) return;
                exportBytes = data;
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("application/json");
                intent.putExtra(Intent.EXTRA_TITLE, name);
                try { startActivityForResult(intent, SAVE_JSON); }
                catch (ActivityNotFoundException e) { exportBytes = null; }
            });
        }
    }
    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == OPEN_JSON) {
            if (fileSelection != null) fileSelection.onReceiveValue(resultCode == RESULT_OK && data != null && data.getData() != null
                ? new Uri[]{data.getData()} : null);
            fileSelection = null;
        } else if (requestCode == SAVE_JSON) {
            byte[] bytes = exportBytes;
            exportBytes = null;
            if (resultCode == RESULT_OK && data != null && data.getData() != null && bytes != null) {
                try (OutputStream out = getContentResolver().openOutputStream(data.getData())) {
                    if (out != null) out.write(bytes);
                } catch (Exception error) {
                    Log.e("AZUR_NATIVE", "Export failed (file was not saved)");
                }
            }
        }
    }
    @Override public void onConfigurationChanged(Configuration config) {
        super.onConfigurationChanged(config);
        if (game != null) game.requestLayout();
    }
    @Override protected void onPause() {
        if (game != null) game.onPause();
        super.onPause();
    }
    @Override protected void onResume() {
        super.onResume();
        if (game != null) game.onResume();
    }
    @Override protected void onDestroy() {
        if (fileSelection != null) fileSelection.onReceiveValue(null);
        if (game != null) {
            game.removeJavascriptInterface("AzNative");
            game.destroy();
            game = null;
        }
        super.onDestroy();
    }
}
