'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserCircle, Key, Bell, Shield, History, Smartphone, Save, Upload } from 'lucide-react';
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function SettingsPage() {
  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="container mx-auto py-10"
    >
      <div className="flex flex-col gap-8">
        <motion.div variants={item} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
            <p className="text-muted-foreground">
              Manage your account preferences and security settings
            </p>
          </div>
          <Button className="bg-[#14DD3C] hover:bg-[#14DD3C]/90 text-white">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </motion.div>

        <div className="flex gap-6">
          {/* Profile Summary Card */}
          <motion.div variants={item} className="w-1/3">
            <Card className="backdrop-blur-sm border border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCircle className="w-5 h-5 text-[#14DD3C]" />
                  Profile Summary
                </CardTitle>
                <CardDescription>Your account information</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-6">
                <div className="relative group">
                  <div className="h-24 w-24 rounded-full bg-[#14DD3C]/10 flex items-center justify-center ring-2 ring-[#14DD3C]/20">
                    <UserCircle className="h-12 w-12 text-[#14DD3C]" />
                  </div>
                  <Button variant="outline" size="sm" className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0">
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
                <div className="w-full space-y-6">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <Label className="text-xs text-muted-foreground">Role</Label>
                    <p className="text-sm font-medium">Admin</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <Label className="text-xs text-muted-foreground">Member Since</Label>
                    <p className="text-sm font-medium">March 2025</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <Label className="text-xs text-muted-foreground">Last Login</Label>
                    <p className="text-sm font-medium">2 hours ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Settings Tabs */}
          <motion.div variants={item} className="flex-1">
            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-6 p-1 bg-muted/50 backdrop-blur-sm">
                <TabsTrigger value="profile" className="data-[state=active]:bg-[#14DD3C] data-[state=active]:text-white">
                  <UserCircle className="w-4 h-4 mr-2" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="security" className="data-[state=active]:bg-[#14DD3C] data-[state=active]:text-white">
                  <Key className="w-4 h-4 mr-2" />
                  Security
                </TabsTrigger>
                <TabsTrigger value="notifications" className="data-[state=active]:bg-[#14DD3C] data-[state=active]:text-white">
                  <Bell className="w-4 h-4 mr-2" />
                  Alerts
                </TabsTrigger>
                <TabsTrigger value="activity" className="data-[state=active]:bg-[#14DD3C] data-[state=active]:text-white">
                  <History className="w-4 h-4 mr-2" />
                  Activity
                </TabsTrigger>
                <TabsTrigger value="devices" className="data-[state=active]:bg-[#14DD3C] data-[state=active]:text-white">
                  <Smartphone className="w-4 h-4 mr-2" />
                  Devices
                </TabsTrigger>
                <TabsTrigger value="api" className="data-[state=active]:bg-[#14DD3C] data-[state=active]:text-white">
                  <Shield className="w-4 h-4 mr-2" />
                  API
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-6">
                <Card className="backdrop-blur-sm border border-white/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCircle className="w-5 h-5 text-[#14DD3C]" />
                      Personal Information
                    </CardTitle>
                    <CardDescription>Update your personal details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm" htmlFor="fullName">Full Name</Label>
                        <Input 
                          id="fullName" 
                          placeholder="John Doe" 
                          className="bg-muted/50 border-white/10 focus:border-[#14DD3C]" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm" htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="john@example.com" 
                          className="bg-muted/50 border-white/10 focus:border-[#14DD3C]" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm" htmlFor="phone">Phone</Label>
                        <Input 
                          id="phone" 
                          placeholder="+1234567890" 
                          className="bg-muted/50 border-white/10 focus:border-[#14DD3C]" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm" htmlFor="timezone">Timezone</Label>
                        <Input 
                          id="timezone" 
                          placeholder="UTC+03:00" 
                          className="bg-muted/50 border-white/10 focus:border-[#14DD3C]" 
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-6">
                <Card className="backdrop-blur-sm border border-white/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="w-5 h-5 text-[#14DD3C]" />
                      Security Settings
                    </CardTitle>
                    <CardDescription>Manage your security preferences</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm">Current Password</Label>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          className="bg-muted/50 border-white/10 focus:border-[#14DD3C]" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">New Password</Label>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          className="bg-muted/50 border-white/10 focus:border-[#14DD3C]" 
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-sm">Two-Factor Authentication</Label>
                      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-[#14DD3C]/10">
                            <Shield className="w-5 h-5 text-[#14DD3C]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">2FA is enabled</p>
                            <p className="text-xs text-muted-foreground">Last verified 2 days ago</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">Configure</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
