import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import BasicTableOne from "../../components/tables/ViewJobs";
import JobsTable from "../../components/tables/ViewJobs";

export default function JobsTables() {
  
  return (
    <>
      <PageMeta
        title="View All Jobs"
        description="View all jobs page"
      />
      <PageBreadcrumb pageTitle="View Jobs" />
      <div className="space-y-6">
        <ComponentCard title="All Jobs">
          <JobsTable />
        </ComponentCard>
      </div>
    </>
  );
}
