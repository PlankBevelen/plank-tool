import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { router } from './router';

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontSize: '14px',
            borderRadius: '10px',
          },
        }}
      />
    </>
  );
}

export default App
