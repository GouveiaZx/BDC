import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Manifest data directly in the API
    const manifest = {
      "name": "BuscaAquiBdC - Classificados",
      "short_name": "BuscaAquiBdC",
      "description": "Plataforma de classificados online para Bom Despacho e região",
      "start_url": "/",
      "display": "standalone",
      "background_color": "#ffffff",
      "theme_color": "#2563eb",
      "orientation": "portrait-primary",
      "scope": "/",
      "lang": "pt-BR",
      "dir": "ltr",
      "categories": ["business", "shopping", "lifestyle"],
      "icons": [
        {
          "src": "/icons/icon-72x72.png",
          "sizes": "72x72",
          "type": "image/png",
          "purpose": "maskable any"
        },
        {
          "src": "/icons/icon-96x96.png",
          "sizes": "96x96",
          "type": "image/png",
          "purpose": "maskable any"
        },
        {
          "src": "/icons/icon-128x128.png",
          "sizes": "128x128",
          "type": "image/png",
          "purpose": "maskable any"
        },
        {
          "src": "/icons/icon-144x144.png",
          "sizes": "144x144",
          "type": "image/png",
          "purpose": "maskable any"
        },
        {
          "src": "/icons/icon-152x152.png",
          "sizes": "152x152",
          "type": "image/png",
          "purpose": "maskable any"
        },
        {
          "src": "/icons/icon-192x192.png",
          "sizes": "192x192",
          "type": "image/png",
          "purpose": "maskable any"
        },
        {
          "src": "/icons/icon-384x384.png",
          "sizes": "384x384",
          "type": "image/png",
          "purpose": "maskable any"
        },
        {
          "src": "/icons/icon-512x512.png",
          "sizes": "512x512",
          "type": "image/png",
          "purpose": "maskable any"
        }
      ],
      "shortcuts": [
        {
          "name": "Adicionar Anúncio",
          "short_name": "Adicionar",
          "description": "Criar um novo anúncio",
          "url": "/dashboard/ads/create",
          "icons": [
            {
              "src": "/icons/shortcut-add.png",
              "sizes": "96x96"
            }
          ]
        },
        {
          "name": "Meus Anúncios",
          "short_name": "Anúncios",
          "description": "Gerenciar meus anúncios",
          "url": "/dashboard/ads",
          "icons": [
            {
              "src": "/icons/shortcut-ads.png",
              "sizes": "96x96"
            }
          ]
        },
        {
          "name": "Buscar",
          "short_name": "Buscar",
          "description": "Buscar anúncios",
          "url": "/search",
          "icons": [
            {
              "src": "/icons/shortcut-search.png",
              "sizes": "96x96"
            }
          ]
        }
      ],
      "share_target": {
        "action": "/share",
        "method": "POST",
        "enctype": "multipart/form-data",
        "params": {
          "title": "title",
          "text": "text",
          "url": "url"
        }
      }
    };
    return new NextResponse(JSON.stringify(manifest), {
      status: 200,
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}