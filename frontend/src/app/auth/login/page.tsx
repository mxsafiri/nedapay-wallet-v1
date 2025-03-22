'use client';

import { Wallet, LineChart, Shield, Banknote, Clock, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { LoginForm } from '@/components/auth/LoginForm';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function LoginPage() {
  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#050806] via-[#14DD3C]/5 to-[#050806]">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-[length:20px_20px]" />
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-[#14DD3C]/3 to-transparent animate-pulse" />
          
          {/* Animated circles */}
          <div className="absolute -left-4 -top-24 w-96 h-96 bg-[#14DD3C]/5 rounded-full blur-3xl animate-blob" />
          <div className="absolute -right-4 -bottom-24 w-96 h-96 bg-[#14DD3C]/5 rounded-full blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-96 h-96 bg-[#14DD3C]/5 rounded-full blur-3xl animate-blob animation-delay-4000" />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-20 flex items-center text-lg font-medium"
        >
          <img src="/logo.svg" alt="NEDApay Logo" className="h-8 w-auto mr-2" />
          NEDApay Admin
        </motion.div>
        
        <div className="relative z-20 mt-20 flex flex-col justify-between h-full">
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            <motion.h2 
              variants={item}
              className="text-4xl font-bold tracking-tight text-white"
            >
              The Smart Payments Hub
            </motion.h2>
            <motion.p 
              variants={item}
              className="text-lg text-white/80"
            >
              Simplify and transform the way you interact with money.
            </motion.p>
          </motion.div>

          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="mt-12 grid gap-6"
          >
            {[
              {
                icon: <Wallet className="h-6 w-6 text-[#14DD3C]" />,
                title: "Secure Wallet Management",
                description: "Advanced security protocols and monitoring"
              },
              {
                icon: <LineChart className="h-6 w-6 text-[#14DD3C]" />,
                title: "Real-time Analytics",
                description: "Instant insights and performance metrics"
              },
              {
                icon: <Shield className="h-6 w-6 text-[#14DD3C]" />,
                title: "Compliance Controls",
                description: "Automated regulatory checks"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={item}
                className="flex items-center space-x-4 rounded-lg bg-black/20 backdrop-blur-sm p-4"
              >
                {feature.icon}
                <div>
                  <h3 className="font-medium text-white">{feature.title}</h3>
                  <p className="text-sm text-white/70">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="mt-auto grid grid-cols-3 gap-4"
          >
            {[
              { icon: <Banknote className="h-8 w-8 text-[#14DD3C]" />, text: "Secure Payments" },
              { icon: <Clock className="h-8 w-8 text-[#14DD3C]" />, text: "24/7 Monitoring" },
              { icon: <ShieldCheck className="h-8 w-8 text-[#14DD3C]" />, text: "Bank-grade Security" }
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={item}
                className="text-center"
              >
                {feature.icon}
                <h4 className="text-sm font-medium text-white">{feature.text}</h4>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="lg:p-8"
      >
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <LoginForm />
        </div>
      </motion.div>
    </div>
  );
}
