import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
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
        <JobsTable />
      </div>
    </>
  );
}
