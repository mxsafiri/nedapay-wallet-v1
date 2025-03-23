'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Building2, LineChart, Lock, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B120C]">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-[#0B120C]/80 backdrop-blur-sm border-b border-[#14DD3C]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <Building2 className="h-8 w-8 text-[#14DD3C]" />
                <span className="text-xl font-bold bg-gradient-to-r from-[#14DD3C] to-white bg-clip-text text-transparent">
                  NEDApay
                </span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="/auth/login" className="w-full sm:w-auto">
                <Button variant="ghost" className="text-white hover:text-[#14DD3C]">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup" className="w-full sm:w-auto">
                <Button className="bg-[#14DD3C] text-black hover:bg-[#14DD3C]/90">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                className="text-white"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-[#0B120C] border-b border-[#14DD3C]/10"
          >
            <div className="px-4 pt-2 pb-3 space-y-1">
              <Link href="/auth/login" className="block w-full mb-2">
                <Button variant="ghost" className="w-full text-white hover:text-[#14DD3C]">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup" className="block w-full">
                <Button className="w-full bg-[#14DD3C] text-black hover:bg-[#14DD3C]/90">
                  Get Started
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6"
          >
            Secure Banking Integration
            <span className="bg-gradient-to-r from-[#14DD3C] to-white bg-clip-text text-transparent">
              {' '}
              Made Simple
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg sm:text-xl text-gray-400 mb-8 max-w-3xl mx-auto"
          >
            Connect your financial institution to our secure platform and manage transactions,
            compliance, and user accounts all in one place.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/auth/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-[#14DD3C] text-black hover:bg-[#14DD3C]/90">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-[#14DD3C] text-[#14DD3C] hover:bg-[#14DD3C]/10">
                Sign In to Dashboard
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#0B120C]/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="h-full"
            >
              <Card className="p-6 bg-[#0B120C] border-[#14DD3C]/20 h-full">
                <Shield className="h-12 w-12 text-[#14DD3C] mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Secure Integration</h3>
                <p className="text-gray-400">
                  Bank-grade security with end-to-end encryption and multi-factor authentication.
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="h-full"
            >
              <Card className="p-6 bg-[#0B120C] border-[#14DD3C]/20 h-full">
                <LineChart className="h-12 w-12 text-[#14DD3C] mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Real-time Monitoring</h3>
                <p className="text-gray-400">
                  Track transactions and system performance with comprehensive analytics.
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="h-full sm:col-span-2 lg:col-span-1"
            >
              <Card className="p-6 bg-[#0B120C] border-[#14DD3C]/20 h-full">
                <Lock className="h-12 w-12 text-[#14DD3C] mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Compliance Ready</h3>
                <p className="text-gray-400">
                  Built-in compliance tools and audit trails for regulatory requirements.
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-[#14DD3C]/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Building2 className="h-6 w-6 text-[#14DD3C]" />
            <span className="text-white font-semibold">NEDApay</span>
          </div>
          <div className="text-sm text-center md:text-right text-gray-400">
            <p> 2023 NEDApay. All rights reserved.</p>
            <div className="mt-2 space-x-4">
              <Link href="/auth/login" className="hover:text-[#14DD3C]">Sign In</Link>
              <Link href="/auth/signup" className="hover:text-[#14DD3C]">Get Started</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
