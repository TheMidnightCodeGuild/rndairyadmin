import "@/styles/globals.css";
import { AuthProvider } from '../lib/auth';
import ProtectedRoute from '../components/ProtectedRoute';

// Add paths that don't require authentication
const publicPaths = ['/login'];

function MyApp({ Component, pageProps, router }) {
  const isPublicPath = publicPaths.includes(router.pathname);

  return (
    <AuthProvider>
      {isPublicPath ? (
        <Component {...pageProps} />
      ) : (
        <ProtectedRoute>
          <Component {...pageProps} />
        </ProtectedRoute>
      )}
    </AuthProvider>
  );
}

export default MyApp;
