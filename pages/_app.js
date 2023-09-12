import "@/styles/globals.css";
import { ThirdwebProvider } from "@thirdweb-dev/react";

export default function App({ Component, pageProps }) {
  return (
    <ThirdwebProvider
      activeChain="goerli"
      clientId={process.env.THIRDWEB_PROVIDER}
    >
      <Component {...pageProps} />
    </ThirdwebProvider>
  );
}
