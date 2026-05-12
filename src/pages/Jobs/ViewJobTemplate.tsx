import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Calendar, User, Clock, CheckCircle, XCircle, AlertCircle, Edit } from 'lucide-react';
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";

import { Job } from "../../types/job";
import { useJobs } from '../../hooks/useJobs';
// Import your hook
// import { useGetJob } from './hooks/useGetJob';

export default  function ViewJobTemplate (){
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { getJobById } = useJobs();
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  
  useEffect(() => {
    const fetchJob = async () => {
      if (jobId) {
        const job = await getJobById(Number(jobId));
        setCurrentJob(job);
      }
    };
    fetchJob();
  }, [jobId, getJobById]);
  
  console.log(currentJob)
  // Replace this mock with your actual hook
  // const { data: job, isLoading, error } = useGetJob(jobId);
  
  // Mock data for demonstration
  const job = {
    id: jobId,
    customerId: 101,
    vehicleId: 201,
    description: "Oil change and tire rotation. Customer reported unusual noise from front left tire. Inspection revealed worn brake pads that need replacement.",
    status: "In Progress",
    assignedTo: "John Smith",
    dueDate: "2025-11-10T10:00:00Z",
    createdAt: "2025-11-06T08:30:00Z",
    updatedAt: "2025-11-08T14:20:00Z",
    serviceCharge: 349.99,
    paid: false,
    paymentMethod: "Credit Card",
    notes: "Customer prefers synthetic oil. Check alignment after tire rotation.",
    isActive: true,
    invoiceId: "INV-2025-001",
    vehicle: { 
      make: "Toyota", 
      model: "Camry", 
      year: 2020, 
      licensePlate: "ABC123",
      vin: "1HGBH41JXMN109186",
      mileage: 45000
    },
    Customer: { 
      name: "Sarah Johnson", 
      email: "sarah@example.com", 
      phone: "(555) 123-4567",
      address: "123 Main St, Springfield, IL"
    },
    Services: [
      { id: 1, name: "Oil Change (Synthetic)", price: 79.99, completed: true },
      { id: 2, name: "Tire Rotation", price: 40.00, completed: true },
      { id: 3, name: "Brake Pad Replacement", price: 180.00, completed: false },
      { id: 4, name: "Brake Inspection", price: 50.00, completed: false }
    ]
  };

  const isLoading = false;
  const error = null;

  const getStatusColor = (status:string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status:string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-5 h-5" />;
      case 'In Progress':
        return <Clock className="w-5 h-5" />;
      case 'Pending':
        return <AlertCircle className="w-5 h-5" />;
      case 'Cancelled':
        return <XCircle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Job</h2>
          <p className="text-gray-600 mb-4">{ 'Failed to load job details'}</p>
          <button
            onClick={() => navigate('/jobs')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Job Not Found</h2>
          <p className="text-gray-600 mb-4">The job you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/jobs')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
<div>
      <PageMeta
        title="Kaza Dashboard - View Job"
        description="View current job details and status"
      />
        <PageBreadcrumb pageTitle="Vehicle Inspection" items={[
    { label: "Home", to: "/" },
    { label: "View All Jobs", to: "/jobs" },
    { label: "Job", to: "/jobs/" },
    { label: "Vehicle Inspection" }, // current page (no `to`)
  ]}/>
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full  text-center">
          
          
          <div className="max-w-9xl mx-auto">
        {/* Header */}
        <div className="mb-6">
         
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2"></h1>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(job.status)}`}>
                  {getStatusIcon(job.status)}
                  {job.status}
                </span>
                {job.isActive && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    Active
                  </span>
                )}
              </div>
            </div>
            
            <button
              onClick={() => navigate(`/jobs/${jobId}/edit`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Edit className="w-4 h-4" />
              Edit Job
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="mb-4 font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl">
           Job #{job.id}
          </h3>

            {/* Description */}
           <ComponentCard title="Description">
             
              <p className="text-sm text-gray-500 dark:text-gray-400 sm:text-base">{job.description}</p>
            </ComponentCard>

            {/* Services */}
            {job.Services && job.Services.length > 0 && (
              <ComponentCard title="Services">
              
                <div className="space-y-3">
                  {job.Services.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {service.completed ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                        )}
                        <span className={`font-medium ${service.completed ? 'text-gray-900' : 'text-gray-600'}`}>
                          {service.name}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400 sm:text-base">
                        ${service.price?.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-2xl text-gray-500 dark:text-gray-400 sm:text-base">Total Service Charge</span>
                  <span className="text-2xl text-gray-500 dark:text-gray-400 ">
                    ${job.serviceCharge?.toFixed(2)}
                  </span>
                </div>
                </ComponentCard>
            )}

            {/* Customer Information */}
           <ComponentCard title="Customer Information">
             
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">Name</div>
                    <div className="font-medium text-gray-900">{job.Customer?.name}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">Email</div>
                    <div className="font-medium text-gray-900">{job.Customer?.email}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">Phone</div>
                    <div className="font-medium text-gray-900">{job.Customer?.phone}</div>
                  </div>
                </div>
                {job.Customer?.address && (
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-600">Address</div>
                      <div className="font-medium text-gray-900">{job.Customer.address}</div>
                    </div>
                  </div>
                )}
              </div>
            </ComponentCard>

            {/* Vehicle Information */}
            <ComponentCard title="Vehicle Information">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Make & Model</div>
                  <div className="font-medium text-gray-900">
                    {job.vehicle?.year} {job.vehicle?.make} {job.vehicle?.model}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">License Plate</div>
                  <div className="font-medium text-gray-900">{job.vehicle?.licensePlate}</div>
                </div>
                {job.vehicle?.vin && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">VIN</div>
                    <div className="font-medium text-gray-900">{job.vehicle.vin}</div>
                  </div>
                )}
                {job.vehicle?.mileage && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Mileage</div>
                    <div className="font-medium text-gray-900">{job.vehicle.mileage.toLocaleString()} mi</div>
                  </div>
                )}
              </div>
            </ComponentCard>

            {/* Notes */}
            {job.notes && (
              <ComponentCard title="Notes">
                <p className="text-gray-700 leading-relaxed">{job.notes}</p>
             </ComponentCard>
            )}
          </div>

          {/* Right Column - Quick Info */}
          <div className="space-y-6">
            {/* Payment Status */}
           <ComponentCard title="Payment Status">
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Status</div>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    job.paid 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {job.paid ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
                {job.paymentMethod && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Method</div>
                    <div className="font-medium text-gray-900">{job.paymentMethod}</div>
                  </div>
                )}
                {job.invoiceId && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Invoice ID</div>
                    <div className="font-medium text-gray-900">{job.invoiceId}</div>
                  </div>
                )}
                <div className="pt-3 border-t">
                  <div className="text-sm text-gray-600 mb-1">Total Amount</div>
                  <div className="text-2xl font-bold text-gray-900">
                    ${job.serviceCharge?.toFixed(2)}
                  </div>
                </div>
              </div>
           </ComponentCard>

            {/* Job Details */}
            <ComponentCard title="Job Details">
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Assigned To</div>
                  <div className="font-medium text-gray-900">{job.assignedTo || 'Unassigned'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Due Date</div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Created</div>
                  <div className="font-medium text-gray-900">{}</div>
                </div>
                {job.updatedAt && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Last Updated</div>
                    <div className="font-medium text-gray-900">{}</div>
                  </div>
                )}
              </div>
            </ComponentCard>

            {/* Actions */}
           <ComponentCard title="Actions">
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Update Status
                </button>
                <button className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Print Invoice
                </button>
                <button className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Send to Customer
                </button>
              </div>
              </ComponentCard>
            </div>
          </div>
        </div>
      </div>
    </div>
      
    
    
      
    </div>
    
  );
};

