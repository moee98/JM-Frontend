import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

import Badge from "../ui/badge/Badge";
import {Job} from "../../types/job";
import {useState, useEffect} from "react";
import * as JobService from "../../services/jobService";
import Button from "../../components/ui/button/Button";
import  * as Icon from "../../icons";
import { useNavigate } from "react-router-dom";

export default function JobsTable() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
     const fetchJobs = async () => {
      try {
        const data = await JobService.getJobs();

        setJobs(data);
        console.log("Jobs fetched:", jobs);
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
      } finally {
        setLoading(false);
      }
    };
  fetchJobs();
  //console.log("Jobs fetched:", jobs);
    }, []);

    if (loading) {
    return <p className="x-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Loading jobs...</p>;
  }

   return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Table Header */}
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Job ID
              </TableCell>
              {/* <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Description
              </TableCell> */}
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Vehicle
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Status
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Price
              </TableCell>
               <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Actions
              </TableCell>

            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="px-5 py-4  text-gray-500 text-theme-sm dark:text-gray-400">{job.id}</TableCell>
                {/* <TableCell className="px-5 py-4  text-gray-500 text-theme-sm dark:text-gray-400">{job.description}</TableCell> */}
                <TableCell className="px-5 py-4  text-gray-500 text-theme-sm dark:text-gray-400">{job.vehicle?.make } {job.vehicle?.model } {job.vehicle?.licensePlate } </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  <Badge
                    size="sm"
                    color={
                      job.status === "Active"
                        ? "success"
                        : job.status === "Pending"
                        ? "warning"
                        : "error"
                    }
                  >
                    {job.status}
                  </Badge>
                </TableCell>
              <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">£{(job.serviceCharge ? job.serviceCharge/100 : 0).toFixed(2)} </TableCell>
              <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                <Button
              size="sm"
              variant="outline"
              startIcon={<Icon.EditIcon className="size-5" />}
              onClick={() => navigate(`/edit-job/${job.id}`)}
            >
             Edit
            </Button>
             <Button
             onClick={() => navigate(`/view-job/${job.id}`)}
              size="sm"
              variant="outline"
              startIcon={<Icon.TaskIcon className="size-5" />}
            >
             View
            </Button>
              </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
