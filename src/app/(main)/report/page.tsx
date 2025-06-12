'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Download, Filter, Calendar, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface Order {
  id: string;
  status: string;
  deadline: string;
  createdAt: string;
  buyer: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  seller: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  gig?: {
    id: string;
    title: string;
  };
  package?: {
    title: string;
    price: number;
  };
  transaction?: {
    txId: string;
    amount: number;
  };
}

interface ReportSummary {
  totalOrders: number;
  totalRevenue: number;
  statusBreakdown: Record<string, number>;
  averageOrderValue: number;
  completedOrders: number;
  pendingOrders: number;
}

interface ReportData {
  orders: Order[];
  summary: ReportSummary;
  filters: {
    userId: string;
    role: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  };
}

export default function OrdersReportPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    userId: '', // This should come from your auth context
    role: 'both' as 'buyer' | 'seller' | 'both',
    status: 'all',
    startDate: '',
    endDate: ''
  });

  // Get current user ID (replace with your auth logic)
  useEffect(() => {
    // This should be replaced with your actual user authentication logic
    const currentUserId = 'user-id-from-auth'; // Replace this
    setFilters(prev => ({ ...prev, userId: currentUserId }));
  }, []);

  const fetchReport = async () => {
    if (!filters.userId) {
      toast.error('User authentication required');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('userId', filters.userId);
      params.append('role', filters.role);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(`/api/orders/report?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch report');
      }

      const data = await response.json();
      setReportData(data);
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!filters.userId) {
      toast.error('User authentication required');
      return;
    }

    try {
      const params = new URLSearchParams();
      params.append('userId', filters.userId);
      params.append('role', filters.role);
      params.append('format', 'pdf');
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(`/api/orders/report?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      WAITING_FOR_PAYMENT: 'bg-yellow-100 text-yellow-800',
      PENDING: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-orange-100 text-orange-800',
      DELIVERED: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Orders Report</h1>
          <p className="text-gray-600">Generate and view detailed reports of your orders</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={downloadPDF} variant="outline" disabled={!reportData}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Select value={filters.role} onValueChange={(value: any) => setFilters(prev => ({ ...prev, role: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">Both (Buyer & Seller)</SelectItem>
                <SelectItem value="buyer">As Buyer</SelectItem>
                <SelectItem value="seller">As Seller</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="WAITING_FOR_PAYMENT">Waiting for Payment</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="Start date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
            />

            <Input
              type="date"
              placeholder="End date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
            />

            <Button onClick={fetchReport} disabled={loading || !filters.userId}>
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {reportData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold">{reportData.summary.totalOrders}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold">${reportData.summary.totalRevenue.toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                  <p className="text-2xl font-bold">${reportData.summary.averageOrderValue.toFixed(2)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold">{reportData.summary.completedOrders}</p>
                </div>
                <Calendar className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status Breakdown */}
      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle>Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(reportData.summary.statusBreakdown).map(([status, count]) => (
                <Badge key={status} className={getStatusColor(status)}>
                  {status.replace('_', ' ')}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders Table */}
      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle>Order Details ({reportData.orders.length} orders)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Order ID</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Gig</th>
                    <th className="text-left p-2">Amount</th>
                    <th className="text-left p-2">Buyer</th>
                    <th className="text-left p-2">Seller</th>
                    <th className="text-left p-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.orders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-mono text-sm">{order.id.substring(0, 8)}...</td>
                      <td className="p-2">
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-2">{order.gig?.title || 'N/A'}</td>
                      <td className="p-2 font-semibold">${order.package?.price?.toFixed(2) || '0.00'}</td>
                      <td className="p-2">{order.buyer.username}</td>
                      <td className="p-2">{order.seller.username}</td>
                      <td className="p-2">{new Date(order.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {reportData && reportData.orders.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No orders found matching the selected criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}