'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  full_name: string;
  kyc_level: number;
  status: string;
  created_at: string;
  last_login: string;
}

type KycLevel = '0' | '1' | '2' | '3' | 'all';
type UserStatus = 'active' | 'suspended' | 'blocked' | 'all';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [kycFilter, setKycFilter] = useState<KycLevel>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatus>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [page, kycFilter, statusFilter, searchTerm]);

  const fetchUsers = async () => {
    try {
      setError(null);
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(kycFilter !== 'all' && { kyc_level: kycFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });

      const response = await api.get(`/admin/users?${params}`);
      setUsers(response.data.data);
      setTotalPages(Math.ceil(response.data.total / 10));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch users';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserKyc = async (userId: string, kycLevel: number) => {
    try {
      setUpdatingUser(userId);
      await api.put(`/admin/users/${userId}/kyc`, { kyc_level: kycLevel });
      toast({
        title: 'Success',
        description: 'User KYC level updated successfully',
      });
      fetchUsers();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update user KYC';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setUpdatingUser(null);
    }
  };

  const updateUserStatus = async (userId: string, status: UserStatus) => {
    try {
      setUpdatingUser(userId);
      await api.put(`/admin/users/${userId}/status`, { status });
      toast({
        title: 'Success',
        description: 'User status updated successfully',
      });
      fetchUsers();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update user status';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setUpdatingUser(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <Button
            variant="outline"
            onClick={() => fetchUsers()}
            disabled={loading}
          >
            {loading ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Loading...
              </>
            ) : (
              'Refresh'
            )}
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                disabled={loading}
              />
            </div>
            <Select
              value={kycFilter}
              onValueChange={(value: KycLevel) => setKycFilter(value)}
              disabled={loading}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="KYC Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="0">Level 0</SelectItem>
                <SelectItem value="1">Level 1</SelectItem>
                <SelectItem value="2">Level 2</SelectItem>
                <SelectItem value="3">Level 3</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(value: UserStatus) => setStatusFilter(value)}
              disabled={loading}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="p-6 border-destructive">
            <div className="flex items-center space-x-2 text-destructive">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p>{error}</p>
            </div>
          </Card>
        )}

        {/* Users Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>KYC Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <LoadingSpinner className="mx-auto" />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Select
                        value={user.kyc_level.toString()}
                        onValueChange={(value: string) => updateUserKyc(user.id, parseInt(value))}
                        disabled={updatingUser === user.id}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue placeholder="KYC Level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Level 0</SelectItem>
                          <SelectItem value="1">Level 1</SelectItem>
                          <SelectItem value="2">Level 2</SelectItem>
                          <SelectItem value="3">Level 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.status}
                        onValueChange={(value: UserStatus) => updateUserStatus(user.id, value)}
                        disabled={updatingUser === user.id}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                          <SelectItem value="blocked">Blocked</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleString()}</TableCell>
                    <TableCell>{new Date(user.last_login).toLocaleString()}</TableCell>
                    <TableCell>
                      {updatingUser === user.id ? (
                        <LoadingSpinner className="h-4 w-4" />
                      ) : (
                        <Button
                          variant="link"
                          onClick={() =>
                            window.location.href = `/admin/users/${user.id}`
                          }
                        >
                          View Details
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Pagination */}
        {!loading && users.length > 0 && (
          <div className="flex items-center justify-between p-4">
            <Button
              variant="outline"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span>
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
