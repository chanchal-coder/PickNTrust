import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const subscribeMutation = useMutation({
    mutationFn: async (email: string) => {
      return apiRequest('POST', '/api/newsletter/subscribe', { email });
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "You've been subscribed to our newsletter!",
      });
      setEmail("");
    },
    onError: (error: any) => {
      toast({
        title: "Oops!",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({
        title: "Please enter your email",
        description: "We need your email to send you amazing deals!",
        variant: "destructive",
      });
      return;
    }
    subscribeMutation.mutate(email);
  };

  return (
    <section className="py-16 bg-gradient-to-r from-navy to-bright-blue text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-8">
          <div className="relative inline-block">
            <h3 className="text-4xl md:text-5xl font-extrabold text-white mb-4 relative drop-shadow-lg">
              <i className="fas fa-bullseye"></i> Exclusive Deals Alert! <i className="fas fa-bell"></i>
              <div className="absolute -top-2 -right-8 text-2xl animate-bounce"><i className="fas fa-envelope"></i></div>
            </h3>
          </div>
          <p className="text-xl text-white font-medium drop-shadow">
            <i className="fas fa-sparkles"></i> Get exclusive deals and insider tips delivered straight to your inbox <i className="fas fa-sparkles"></i>
          </p>
        </div>
        
        <div className="bg-white rounded-3xl p-8 max-w-md mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
              type="email" 
              placeholder="Enter your email address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl border-2 border-gray-200 focus:border-bright-blue outline-none text-navy text-center"
              disabled={subscribeMutation.isPending}
            />
            <button 
              type="submit" 
              disabled={subscribeMutation.isPending}
              className="w-full bg-gradient-to-r from-accent-green to-green-600 text-white font-bold py-4 px-8 rounded-2xl hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
            >
              <i className="fas fa-envelope mr-2"></i>
              {subscribeMutation.isPending ? "Subscribing..." : "Subscribe Now"}
            </button>
          </form>
          <p className="text-gray-500 text-sm mt-4">Join 15,000+ subscribers • Unsubscribe anytime</p>
        </div>
      </div>
    </section>
  );
}
