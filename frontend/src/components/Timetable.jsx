import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Image from "./Image";
import Footer from "./Footer";
import Logo from "./Logo";
import { useNavigate } from "react-router-dom";

function Timetable() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Persuing");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const subjectsPerPage = 14;
  const navigate = useNavigate();

  // Enhanced data processing
  const processedCourses = useMemo(() => {
    if (!courses.length) return [];
    
    const uniqueMap = new Map();
    
    courses.forEach(course => {
      const cleanCourse = {
        ...course,
        course: course.course && course.course.trim() ? course.course : 'MODULE',
        subjectname: course.subjectname || 'N/A',
    status: course.status || 'pending',
        batch_time: course.batch_time || 'N/A',
        faculty: course.faculty || 'N/A',
        startdate: course.startdate,
        endate: course.endate
      };
      
      // For pending subjects, we need a different key since batch_time might be same
      const key = selectedStatus.toLowerCase() === 'pending' 
        ? `${cleanCourse.course}-${cleanCourse.subjectname}`
        : `${cleanCourse.course}-${cleanCourse.subjectname}-${cleanCourse.batch_time}`;
      
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, cleanCourse);
      }
    });
    
    return Array.from(uniqueMap.values());
  }, [courses, selectedStatus]);

  // Get unique courses for dropdown - show all courses from fetched data
  const uniqueCourses = useMemo(() => {
    const coursesList = processedCourses
      .filter(course => 
        course.course &&
        course.course.trim() !== "" &&
        course.course !== 'MODULE' &&
        course.subjectname &&
        course.subjectname !== "SUBJECTS"
      )
      .map(course => course.course);
    
    return Array.from(new Set(coursesList)).sort();
  }, [processedCourses]);

  // Auto-select first course if none selected
  useEffect(() => {
    if (!selectedCourse && uniqueCourses.length > 0) {
      setSelectedCourse(uniqueCourses[0]);
    }
  }, [uniqueCourses, selectedCourse]);

  // FIXED: Enhanced filtering with status and course filter
 const filteredSubjects = useMemo(() => {
  if (!selectedCourse) return [];
  return processedCourses.filter(sub => sub.course === selectedCourse);
}, [selectedCourse, processedCourses]);
  // Pagination
  const currentSubjects = useMemo(() => {
    return filteredSubjects.slice(
      (currentPage - 1) * subjectsPerPage,
      currentPage * subjectsPerPage
    );
  }, [filteredSubjects, currentPage, subjectsPerPage]);

  const totalPages = Math.ceil(filteredSubjects.length / subjectsPerPage);

  // Enhanced data fetching
 // Enhanced data fetching with debug logs
const fetchCourseDetails = async () => {
  try {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const name_contactid = userData.name_contactid || userData.id;

    console.log("🔍 Frontend - Fetching data with:", {
      name_contactid,
      selectedStatus,
      token: token ? "exists" : "missing"
    });

    if (!name_contactid) {
      setError("User ID not found");
      return;
    }

    const response = await axios.get(
      "https://studentapp.i-tech.net.in/api/v1/routes/get-batch",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        params: { 
          name_contactid,
          status: selectedStatus
        },
        withCredentials: true,
        timeout: 10000,
      }
    );

    console.log("🔍 Frontend - Response received:", {
      status: response.status,
      dataLength: response.data?.length,
      data: response.data
    });

    if (Array.isArray(response.data)) {
      setCourses(response.data);
      console.log("🔍 Frontend - Courses set:", response.data.length);
      
      if (!selectedCourse && response.data.length > 0) {
        const firstCourse = response.data.find(item => 
          item.course && item.course.trim() && item.course !== 'MODULE'
        );
        if (firstCourse) {
          setSelectedCourse(firstCourse.course);
          console.log("🔍 Frontend - Auto-selected course:", firstCourse.course);
        }
      }
    } else {
      setError("Invalid data format received from server");
    }
  } catch (error) {
    console.error("❌ Frontend - Fetch error:", error);
    if (axios.isAxiosError(error)) {
      console.error("❌ Frontend - Axios error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.code === 'ECONNABORTED') {
        setError("Request timeout. Please try again.");
      } else {
        setError("Failed to fetch data. Please check your connection.");
      }
    } else {
      setError("An unexpected error occurred");
    }
  } finally {
    setLoading(false);
  }
};
  // Fetch data when status changes
  useEffect(() => {
    fetchCourseDetails();
  }, [selectedStatus]);

  // Reset to first page when course or status changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCourse, selectedStatus]);

  const handleCourseSelection = (e) => {
    setSelectedCourse(e.target.value);
  };

  const handleStatusSelection = (status) => {
    setSelectedStatus(status);
  };

  const handleViewAttendance = (batchTime, subject) => {
    // Don't allow viewing attendance for pending subjects
    if (selectedStatus.toLowerCase() === 'pending') return;
    
    if (!batchTime || !subject || batchTime === 'N/A' || subject === 'N/A') return;
    navigate(
      `/attend?batchtime=${encodeURIComponent(batchTime)}&subject=${encodeURIComponent(subject)}`
    );
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const renderPageNumbers = () => {
    if (totalPages <= 1) return null;
    const pageNumbers = [];
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    
    if (currentPage <= 3) {
      startPage = 1;
      endPage = Math.min(5, totalPages);
    }
    if (currentPage >= totalPages - 2) {
      startPage = Math.max(1, totalPages - 4);
      endPage = totalPages;
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => paginate(i)}
          className={`px-2 py-1 sm:px-3 sm:py-1.5 border rounded text-xs sm:text-sm ${
            currentPage === i ? "bg-gray-300" : "bg-white"
          }`}
        >
          {i}
        </button>
      );
    }
    return pageNumbers;
  };

  return (
    <div className="inset-0 h-screen w-screen flex flex-col md:flex-row font-mono">
      <div className="w-full md:w-[60%] flex flex-col items-center bg-gray-100 shadow-md h-full">
        <Logo />
        <div className="mt-3 flex-1 overflow-y-auto w-full flex flex-col items-center p-3">
          <h1 className="text-xl md:text-2xl text-center font-bold mb-3">
            My Batch Details
          </h1>

          {loading && (
            <div className="text-blue-600 mb-3 flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              Loading...
            </div>
          )}
          {error && (
            <div className="text-red-600 mb-3 text-center bg-red-50 p-2 rounded border border-red-200">
              {error}
              <button 
                onClick={fetchCourseDetails}
                className="ml-2 text-blue-600 underline text-sm"
              >
                Retry
              </button>
            </div>
          )}

          <select
            className="border border-gray-400 p-1 md:p-2 rounded mb-3 text-sm md:text-base w-full max-w-md"
            value={selectedCourse}
            onChange={handleCourseSelection}
            disabled={loading || !uniqueCourses.length}
          >
            <option value="">Select a Course</option>
            {uniqueCourses.map((course, index) => (
              <option key={index} value={course}>
                {course}
              </option>
            ))}
          </select>

          <div className="flex flex-wrap gap-3 mb-4 justify-center">
            {["Pending", "Persuing", "Completed"].map((status) => (
              <button
                key={status}
                className={`px-3 py-1 rounded text-xs md:text-sm transition-colors ${
                  selectedStatus === status
                    ? "bg-gray-800 text-white"
                    : "bg-gray-300 text-black hover:bg-gray-400"
                } ${!selectedCourse ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => handleStatusSelection(status)}
             disabled={loading}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="w-full overflow-x-auto">
            <table className="min-w-[600px] w-full border-collapse border border-gray-300 text-xs md:text-sm bg-white">
              <thead>
                <tr className="bg-gray-200 text-center">
                  <th className="border p-2">Subject</th>
                  {selectedStatus !== "Pending" && (
                    <>
                      <th className="border p-2">Batch Time</th>
                      <th className="border p-2">Faculty</th>
                      <th className="border p-2">Start Date</th>
                      <th className="border p-2">End Date</th>
                      <th className="border p-2">Action</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {currentSubjects.length === 0 ? (
                  <tr>
                    <td
                      colSpan={selectedStatus !== "Pending" ? 6 : 1}
                      className="text-center p-3 text-gray-500"
                    >
                      {loading 
                        ? "Loading..." 
                        : selectedCourse && selectedStatus
                        ? `No ${selectedStatus.toLowerCase()} subjects found for ${selectedCourse}.`
                        : selectedCourse
                        ? "Please select a status."
                        : "Please select a course."}
                    </td>
                  </tr>
                ) : (
                  currentSubjects.map((sub, index) => (
                    <tr key={`${sub.course}-${sub.subjectname}-${index}`} className="text-center hover:bg-gray-50">
                      <td className="border p-2">{sub.subjectname}</td>
                      {selectedStatus !== "Pending" && (
                        <>
                          <td className="border p-2">{sub.batch_time}</td>
                          <td className="border p-2">{sub.faculty}</td>
                          <td className="border p-2">
                            {sub.startdate ? new Date(sub.startdate).toLocaleDateString() : "N/A"}
                          </td>
                          <td className="border p-2">
                            {sub.endate ? new Date(sub.endate).toLocaleDateString() : "N/A"}
                          </td>
                          <td className="border p-2">
                            <button
                              className="bg-blue-600 text-white px-2 py-1 rounded-md text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              onClick={() => handleViewAttendance(sub.batch_time, sub.subjectname)}
                              disabled={!sub.batch_time || !sub.subjectname || sub.batch_time === 'N/A' || sub.subjectname === 'N/A'}
                            >
                              View
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:gap-3">
              <button
                onClick={() => paginate(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 border rounded text-xs sm:text-sm disabled:opacity-50 hover:bg-gray-100 transition-colors"
              >
                Previous
              </button>
              {renderPageNumbers()}
              <button
                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 border rounded text-xs sm:text-sm disabled:opacity-50 hover:bg-gray-100 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
        <Footer />
      </div>
      <Image />
    </div>
  );
}

export default Timetable;