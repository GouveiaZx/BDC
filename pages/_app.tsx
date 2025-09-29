// Como estamos usando o app router para a maioria das páginas,
// este arquivo _app.tsx serve apenas para as páginas legadas que ainda
// possam existir no diretório pages/

import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}