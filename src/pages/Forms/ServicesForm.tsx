import { useState } from "react";
import { useService, useCreateService } from "../../hooks/useServices";
import SearchMultiSelect from "../../components/form/form-elements/SearchMultiSelect";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import TextArea from "../../components/form/input/TextArea";
import { Service } from "../../types/service";
import Alert from "../../components/ui/alert/Alert";

export interface ServiceFormData {
  serviceType: 'existing' | 'new';
  selectedServices?: (Service & { customPrice?: number })[];
  newServiceData?: {
    name: string;
    description: string;
    price: number;
  };
}

interface ServiceFormProps {
  onDataChange?: (data: ServiceFormData) => void;
  initialData?: Partial<ServiceFormData>;
  useCreateService?: () => any;
}

// NewServiceForm Component
interface NewServiceFormProps {
  onServiceCreated?: (service: Service) => void;
  useCreateService?: (service: Service) => any;
}

const NewServiceForm: React.FC<NewServiceFormProps> = ({ onServiceCreated }) => {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [showNewForm, setShowNewForm] = useState(false);
  const createServiceMutation = useCreateService?.();

  const [alert, setAlert] = useState<{
    show: boolean;
    variant: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  } | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const newService: Service = {
      id: 0,
      name: name,
      description: description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedPrice: parseFloat(price),
      isActive: true,
    };

    if (createServiceMutation) {
      await createServiceMutation.mutate(newService, {
        onSuccess: (response: any) => {
          // response may be an AxiosResponse or the created service directly depending on the implementation
          const createdService: Service = response?.data ?? response;

          setAlert({
            show: true,
            variant: 'success',
            title: 'Service Created Successfully',
            message: `${createdService.name} has been added to your services.`
          });
          
          setName("");
          setDescription("");
          setPrice("");
          
          setTimeout(() => setAlert(null), 4000);
          
          onServiceCreated?.(createdService);
          setShowNewForm(false);
        },
        onError: (error: any) => {
          setAlert({
            show: true,
            variant: 'error',
            title: 'Failed to Create Service',
            message: `${error.response?.data?.message || 'An error occurred while adding the service.'}`
          });
        }
      });
    } else {
        setAlert({
        show: true,
        variant: 'success',
        title: 'Service Created Successfully',
        message: `${newService.name} has been added to your services.`
      });
      
      setName("");
      setDescription("");
      setPrice("");
      
      setTimeout(() => setAlert(null), 4000);
      
      onServiceCreated?.(newService);
      setShowNewForm(!showNewForm);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 rounded-md border border-gray-300 py-1.5 pl-3 pr-3 shadow-theme-xs transition focus:border-brand-300 focus:shadow-focus-ring dark:border-gray-700 dark:bg-gray-900 dark:focus:border-brand-300">
      <div>
        <Label htmlFor="service-name">Service Name</Label>
        <Input
          type="text"
          id="service-name"
          placeholder="e.g., Oil Change"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="service-description">Description</Label>
        <TextArea
          placeholder="Service description"
          value={description}
          onChange={(e) => setDescription(e.toString())}
          rows={3}
        />
      </div>
      <div>
        <Label htmlFor="service-price">Price (£)</Label>
        <Input
          type="number"
          id="service-price"
          placeholder="0.00"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          
          min="0"
          
        />
      </div>
      <Button 
       
        size="sm" 
        variant="primary"
        className="w-full"
        disabled={createServiceMutation?.isPending}
      >
        {createServiceMutation?.isPending ? "Adding..." : "Add Service"}
      </Button>
      {alert && (
        <Alert
          variant={alert.variant}
          title={alert.title}
          message={alert.message}
          showLink={false}
        />
      )}
    </form>
  );
};

// Main ServiceForm Component
export const ServiceForm: React.FC<ServiceFormProps> = ({ 
  onDataChange,
}) => {
  const [selectedServices, setSelectedServices] = useState<(Service & { customPrice?: number })[]>([]);
  const [showNewForm, setShowNewForm] = useState(false);

  // Get services from hook
  const { data: allServices } = useService();

  function useServicesOptions() {
    if (!allServices) return [];
    console.log("All Services:", allServices);
    return allServices.map((service: Service) => ({
      value: String(service.id),
      text: service.name,
      selected: selectedServices.some(s => s.id === service.id),
    }));
  }

  const serviceOptions = useServicesOptions();

  const handleServiceSelect = (values: string[]): void => {
    // Convert selected IDs to full Service objects
    const services = allServices?.filter((service: Service) => 
      values.includes(service.id.toString())
    ).map(service => {
      // Check if service already exists in selectedServices to preserve custom price
      const existing = selectedServices.find(s => s.id === service.id);
      return existing || { ...service, customPrice: service.estimatedPrice };
    }) || [];
    
    setSelectedServices(services);
    onDataChange?.({ 
      serviceType: 'existing', 
      selectedServices: services 
    });
    
  };

  const handlePriceChange = (serviceId: number, newPrice: string): void => {
    const updatedServices = selectedServices.map(service => {
      if (service.id === serviceId) {
        return { ...service, customPrice: parseFloat(newPrice) || 0 };
      }
      return service;
    });
    
    setSelectedServices(updatedServices);
    onDataChange?.({ 
      serviceType: 'existing', 
      selectedServices: updatedServices 
    });
  };

  const handleServiceCreated = (newService: Service): void => {
    console.log("New service created:", newService);
    const updatedServices = [...selectedServices, { ...newService, customPrice: newService.estimatedPrice }];
    setSelectedServices(updatedServices);
    setShowNewForm(false);
    onDataChange?.({ 
      serviceType: 'existing', 
      selectedServices: updatedServices 
    });
  };

  const calculateTotal = (): number => {
    return selectedServices.reduce((total, service) => 
      total + (service.customPrice ?? service.estimatedPrice ?? 0), 0
    );
  };

  return (
    <div className="space-y-6">
      <SearchMultiSelect 
        label="Services" 
        options={serviceOptions}
        onChange={handleServiceSelect}
      />
      
      {/* Selected Services Table */}
      {selectedServices.length > 0 && (
        <div className="border border-gray-200 rounded-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Service Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Price (£)
                </th>
                {/* <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Action
                </th> */}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {selectedServices.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {service.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {service.description || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 text-right">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={service.customPrice ?? service.estimatedPrice ?? 0}
                      onChange={(e) => handlePriceChange(service.id, e.target.value)}
                      className="w-24 px-2 py-1 text-right border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </td>
                  {/* <td className="px-4 py-3 text-sm text-center">
                    <button
                      onClick={() => handleRemoveService(service.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-bold text-lg"
                      title="Remove service"
                      type="button"
                    >
                      ✕
                    </button>
                  </td> */}
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <td colSpan={2} className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 text-right">
                  Total:
                </td>
                <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-gray-100 text-right">
                  £{calculateTotal().toFixed(2)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      
      <div>
        <Button 
          size="sm" 
          variant="primary"
          onClick={() => setShowNewForm(!showNewForm)}
         
        >
          {showNewForm ? "Cancel" : "Add new service"}
        </Button>
      </div>

      {showNewForm && (
        <NewServiceForm 
          onServiceCreated={handleServiceCreated}
          useCreateService={useCreateService}
        />
      )}
    </div>
  );
};

export default ServiceForm;