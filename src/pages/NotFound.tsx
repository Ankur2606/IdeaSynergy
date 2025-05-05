
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      <Header />
      
      <main className="flex-grow flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-9xl font-bold text-synergy-blue mb-6">404</h1>
          <p className="text-2xl text-gray-600 dark:text-gray-300 mb-8">Oops! We couldn't find this page</p>
          
          <Button 
            onClick={() => navigate('/')} 
            className="bg-synergy-blue hover:bg-synergy-blue/90 px-6 py-3 flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Return to Home
          </Button>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default NotFound;
