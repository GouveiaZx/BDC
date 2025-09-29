package com.bdc.classificados;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import android.widget.Toast;

public class BDCWebViewClient extends WebViewClient {
    
    private Context context;
    private ProgressBar progressBar;
    
    public BDCWebViewClient(Context context, ProgressBar progressBar) {
        this.context = context;
        this.progressBar = progressBar;
    }
    
    @Override
    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        String url = request.getUrl().toString();
        
        // Handle external links (social media, payment gateways, etc.)
        if (shouldOpenExternally(url)) {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            try {
                context.startActivity(intent);
            } catch (Exception e) {
                Toast.makeText(context, "Não foi possível abrir o link", Toast.LENGTH_SHORT).show();
            }
            return true;
        }
        
        // Handle tel: links
        if (url.startsWith("tel:")) {
            Intent intent = new Intent(Intent.ACTION_DIAL, Uri.parse(url));
            try {
                context.startActivity(intent);
            } catch (Exception e) {
                Toast.makeText(context, "Não foi possível fazer a ligação", Toast.LENGTH_SHORT).show();
            }
            return true;
        }
        
        // Handle mailto: links
        if (url.startsWith("mailto:")) {
            Intent intent = new Intent(Intent.ACTION_SENDTO, Uri.parse(url));
            try {
                context.startActivity(intent);
            } catch (Exception e) {
                Toast.makeText(context, "Não foi possível abrir o email", Toast.LENGTH_SHORT).show();
            }
            return true;
        }
        
        // Handle WhatsApp links
        if (url.contains("wa.me") || url.contains("whatsapp.com")) {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            try {
                context.startActivity(intent);
            } catch (Exception e) {
                Toast.makeText(context, "WhatsApp não está instalado", Toast.LENGTH_SHORT).show();
            }
            return true;
        }
        
        // Load within WebView for same domain
        return false;
    }
    
    @Override
    public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
        super.onPageStarted(view, url, favicon);
        progressBar.setVisibility(android.view.View.VISIBLE);
    }
    
    @Override
    public void onPageFinished(WebView view, String url) {
        super.onPageFinished(view, url);
        progressBar.setVisibility(android.view.View.GONE);
    }
    
    @Override
    public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
        super.onReceivedError(view, errorCode, description, failingUrl);
        
        // Show error page or retry option
        String errorHtml = createErrorPage(description);
        view.loadData(errorHtml, "text/html", "UTF-8");
    }
    
    private boolean shouldOpenExternally(String url) {
        // List of domains/patterns that should open externally
        String[] externalDomains = {
            "facebook.com",
            "instagram.com",
            "youtube.com",
            "google.com/maps",
            "asaas.com",
            "mercadopago.com",
            "pagseguro.com"
        };
        
        for (String domain : externalDomains) {
            if (url.contains(domain)) {
                return true;
            }
        }
        
        return false;
    }
    
    private String createErrorPage(String errorMessage) {
        return "<!DOCTYPE html>" +
               "<html>" +
               "<head>" +
               "<meta charset='UTF-8'>" +
               "<meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
               "<title>Erro de Conexão</title>" +
               "<style>" +
               "body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }" +
               ".error-container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }" +
               ".error-icon { font-size: 64px; margin-bottom: 20px; }" +
               "h1 { color: #333; margin-bottom: 20px; }" +
               "p { color: #666; margin-bottom: 30px; }" +
               ".retry-btn { background: #7ad38e; color: white; border: none; padding: 15px 30px; border-radius: 5px; font-size: 16px; cursor: pointer; }" +
               "</style>" +
               "</head>" +
               "<body>" +
               "<div class='error-container'>" +
               "<div class='error-icon'>⚠️</div>" +
               "<h1>Erro de Conexão</h1>" +
               "<p>Não foi possível carregar a página. Verifique sua conexão com a internet.</p>" +
               "<p><small>" + errorMessage + "</small></p>" +
               "<button class='retry-btn' onclick='window.location.reload()'>Tentar Novamente</button>" +
               "</div>" +
               "</body>" +
               "</html>";
    }
}