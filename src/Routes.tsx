import { Routes, Route, BrowserRouter as Router } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import JobsTables from "./pages/Tables/JobsTable";
import NewJobForm from "./pages/Forms/FormElements";
import CreateJob from "./pages/Forms/CreateJob";
import ViewJobPage from "./pages/Jobs/ViewJob";
import ViewJobTemplate from "./pages/Jobs/ViewJobTemplate";
import  CreateJobPage  from "./pages/Jobs/CreateJobTemplate";
import VehicleInspectionFormPage from "./pages/Jobs/VehicleInspection";
import InvoicePage from "./pages/Jobs/Invoice";
import EditJobPage from "./pages/Jobs/EditJob";
import AddExpensePage from "./pages/Expenses/AddExpense";
import ExpenseReportsPage from "./pages/Expenses/ExpenseReports";

const AppRoutes = () => (
  <Router>
    <ScrollToTop />
    <Routes>
      {/* Dashboard Layout - Protected */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index path="/" element={<Home />} />
        <Route path="/profile" element={<UserProfiles />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/blank" element={<Blank />} />
        <Route path="/form-elements" element={<FormElements />} />
        <Route path="/create-job" element={<CreateJob />} />
        <Route path="/view-job/:jobId" element={<ViewJobPage />} />
        <Route path="/view-job-template/:jobId" element={<ViewJobTemplate />} />
        <Route path="/create-job-template" element={<CreateJobPage />} />
        <Route path="/invoice/:jobId" element={<InvoicePage />} />
        <Route path="/jobs/:jobId/edit" element={<EditJobPage />} />
        <Route path="/edit-job/:jobId" element={<EditJobPage />} />
        <Route path="/expenses/add" element={<AddExpensePage />} />
        <Route path="/expenses/reports" element={<ExpenseReportsPage />} />
        <Route
        path="/jobs/:jobId/inspection/new"
        element={
          <VehicleInspectionFormPage/>}
          
        
      />
        <Route path="/basic-tables" element={<BasicTables />} />
        <Route path="/jobs-tables" element={<JobsTables />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/avatars" element={<Avatars />} />
        <Route path="/badge" element={<Badges />} />
        <Route path="/buttons" element={<Buttons />} />
        <Route path="/images" element={<Images />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/line-chart" element={<LineChart />} />
        <Route path="/bar-chart" element={<BarChart />} />
      </Route>

      {/* Auth Pages - Public */}
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Router>
);

export default AppRoutes;
