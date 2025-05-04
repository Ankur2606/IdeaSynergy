
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Header from "../components/Header";
import Footer from "../components/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-synergy-blue mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-6">Oops! We couldn't find this page</p>
          
          <Button asChild className="bg-synergy-blue hover:bg-synergy-blue/90">
            <a href="/">Return to Home</a>
          </Button>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default NotFound;
