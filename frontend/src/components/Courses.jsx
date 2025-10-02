import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import Image from "./Image";
import Footer from "./Footer";
import Logo from "./Logo";
import { useSelector } from "react-redux";

function Courses() {
  const user = useSelector((state) => state.auth.user);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Memoized unique courses
  const uniqueCourses = useMemo(() => {
    return Array.isArray(courses) 
      ? [...new Set(courses.map((c) => c.course).filter(Boolean))]
      : [];
  }, [courses]);

  // Memoized filtered subjects
  const subjects = useMemo(() => {
    if (!selectedCourse || !Array.isArray(courses)) return [];
    return courses.filter((course) => course.course === selectedCourse);
  }, [selectedCourse, courses]);

  // Categorized subjects
  const categorizedSubjects = useMemo(() => {
    return {
      pending: subjects.filter((sub) => sub.status === "Pending"),
      pursuing: subjects.filter((sub) => sub.status === "Persuing"),
      completed: subjects.filter((sub) => sub.status === "Completed")
    };
  }, [subjects]);

  const activeTables = Object.values(categorizedSubjects).filter(arr => arr.length > 0).length;

// In your fetchCourseDetails function
const fetchCourseDetails = useCallback(async () => {
  try {
    setLoading(true);
    setError("");
    
    console.log("🔍 Frontend - Current user:", user);
    console.log("🔍 Frontend - name_contactid value:", user?.name_contactid);
    console.log("🔍 Frontend - name_contactid type:", typeof user?.name_contactid);

    if (!user?.name_contactid) {
      console.log("❌ Frontend - name_contactid is undefined or empty");
      setError("User information not available - no name_contactid found");
      return;
    }

    // Make sure the value is not null/undefined
    const nameContactId = user.name_contactid;
    if (!nameContactId || nameContactId === "null" || nameContactId === "undefined") {
      console.log("❌ Frontend - name_contactid is invalid:", nameContactId);
      setError("Invalid user information");
      return;
    }

    console.log("🔍 Frontend - Making API call with name_contactid:", nameContactId);

    const response = await axios.get("https://studentapp.i-tech.net.in/api/v1/routes/course-details", {
      params: { 
        name_contactid: nameContactId 
      }
    });
    
    console.log("🔍 Frontend - Full API response:", response);
    console.log("🔍 Frontend - API response data:", response.data);
    
    const result = response.data;
    
    // Check if the API call was successful
    if (result.success) {
      // The actual courses array is in result.data
      if (Array.isArray(result.data)) {
        console.log("✅ Frontend - Courses data set successfully, count:", result.data.length);
        setCourses(result.data);
      } else {
        console.log("❌ Frontend - Data is not an array:", result.data);
        setError("Invalid data format received from server");
        setCourses([]);
      }
    } else {
      // API returned success: false
      console.log("❌ Frontend - API returned error:", result.message);
      setError(result.message || "Failed to load course details");
      setCourses([]);
    }
  } catch (error) {
    console.error("❌ Frontend - Error fetching course details", error);
    
    if (error.response) {
      console.log("🔍 Frontend - Error response data:", error.response.data);
      console.log("🔍 Frontend - Error response status:", error.response.status);
      
      // Handle backend error response structure
      const errorData = error.response.data;
      setError(errorData.message || "Failed to load course details");
    } else if (error.request) {
      console.log("🔍 Frontend - No response received");
      setError("Network error: Could not connect to server");
    } else {
      console.log("🔍 Frontend - Request setup error");
      setError("An unexpected error occurred");
    }
    
    setCourses([]);
  } finally {
    setLoading(false);
  }
}, [user?.name_contactid]);

// Enhanced debug useEffect
useEffect(() => {
  console.log("=== COURSES COMPONENT DEBUG ===");
  console.log("🔍 User object:", user);
  console.log("🔍 name_contactid:", user?.name_contactid);
  console.log("🔍 name_contactid exists:", !!user?.name_contactid);
  console.log("🔍 User keys:", user ? Object.keys(user) : "No user");
  
  if (user?.name_contactid) {
    console.log("✅ name_contactid found, fetching course details...");
    fetchCourseDetails();
  } else {
    console.log("❌ name_contactid not found in user object");
  }
}, [fetchCourseDetails, user?.name_contactid]);

  const handleCourseChange = (e) => {
    setSelectedCourse(e.target.value);
  };

  if (loading) {
    return (
      <div className="inset-0 h-screen w-screen flex flex-col md:flex-row font-mono">
        <div className="w-full md:w-[60%] flex flex-col items-center justify-center bg-gray-100 shadow-md h-full">
          <div className="text-xl">Loading course details...</div>
        </div>
        <Image />
      </div>
    );
  }

  return (
    <div className="inset-0 h-screen w-screen flex flex-col md:flex-row font-mono">
      <div className="w-full md:w-[60%] flex flex-col items-center bg-gray-100 shadow-md h-full">
        <Logo />
        <div className="mt-5 flex-1 overflow-y-auto w-full flex flex-col items-center p-4">
          <h2 className="text-sm text-center font-bold mb-4">
            Welcome, {user?.name || "Student"}
          </h2>

          <h1 className="text-2xl text-center font-bold mb-4">
            My Course Details
          </h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <select
            className="border p-2 sm:p-3 rounded mb-4 w-full max-w-xs text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedCourse}
            onChange={handleCourseChange}
          >
            <option value="">Select a Course</option>
            {uniqueCourses.map((course, index) => (
              <option key={index} value={course}>
                {course}
              </option>
            ))}
          </select>

          {selectedCourse && (
            <div
              className={`w-full max-w-screen-lg px-2 sm:px-4 ${
                activeTables === 1 ? "flex justify-center" : ""
              }`}
            >
              <div
                className={`grid ${
                  activeTables === 1
                    ? ""
                    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                } gap-4 w-full`}
              >
                {categorizedSubjects.pending.length > 0 && (
                  <Table title="Pending Subjects" subjects={categorizedSubjects.pending} />
                )}
                {categorizedSubjects.pursuing.length > 0 && (
                  <Table title="Pursuing Subjects" subjects={categorizedSubjects.pursuing} />
                )}
                {categorizedSubjects.completed.length > 0 && (
                  <Table title="Completed Subjects" subjects={categorizedSubjects.completed} />
                )}
              </div>
            </div>
          )}

          {selectedCourse && subjects.length === 0 && !loading && (
            <div className="text-gray-500 mt-4">
              No subjects found for the selected course.
            </div>
          )}
        </div>
        <Footer />
      </div>
      <Image />
    </div>
  );
}

const Table = ({ title, subjects }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const subjectsPerPage = 14;

  const currentSubjects = useMemo(() => {
    return Array.isArray(subjects)
      ? subjects.slice(
          (currentPage - 1) * subjectsPerPage,
          currentPage * subjectsPerPage
        )
      : [];
  }, [subjects, currentPage, subjectsPerPage]);

  const totalPages = Math.ceil(
    (Array.isArray(subjects) ? subjects.length : 0) / subjectsPerPage
  );

  const paginate = useCallback((pageNumber) => {
    setCurrentPage(pageNumber);
  }, []);

  const renderPageNumbers = useCallback(() => {
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
          className={`px-2 py-1 sm:px-3 sm:py-1.5 border rounded text-xs sm:text-sm transition-colors ${
            currentPage === i 
              ? "bg-blue-500 text-white border-blue-500" 
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
          }`}
        >
          {i}
        </button>
      );
    }
    return pageNumbers;
  }, [currentPage, totalPages, paginate]);

  const titleColors = {
    "Pending Subjects": "text-red-500",
    "Pursuing Subjects": "text-yellow-500",
    "Completed Subjects": "text-green-500",
  };

  // Reset to page 1 when subjects change
  useEffect(() => {
    setCurrentPage(1);
  }, [subjects]);

  return (
    <div className="bg-white w-full p-4 rounded-lg shadow-md overflow-hidden flex flex-col max-w-full mx-auto">
      <h2
        className={`text-base sm:text-lg font-bold mb-3 ${
          titleColors[title] || "text-gray-800"
        }`}
      >
        {title} ({subjects.length})
      </h2>
      
      <div className="overflow-x-auto flex-1">
        <table className="w-full border-collapse border border-gray-300 text-xs sm:text-sm md:text-base">
          <thead>
            <tr className="bg-gray-100 border border-gray-300">
              <th className="border border-gray-300 p-2 sm:p-3 text-center font-semibold">
                Subject
              </th>
            </tr>
          </thead>
          <tbody>
            {currentSubjects.map((sub, index) => (
              <tr 
                key={`${sub.subjectname}-${index}`} 
                className="border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <td className="border border-gray-300 p-2 sm:p-3 text-center">
                  {sub.subjectname || "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex flex-wrap justify-center items-center gap-2 sm:gap-3">
          <button
            onClick={() => paginate(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-2 py-1 sm:px-3 sm:py-1.5 border border-gray-300 rounded text-xs sm:text-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
          >
            Previous
          </button>
          
          {renderPageNumbers()}
          
          <button
            onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-2 py-1 sm:px-3 sm:py-1.5 border border-gray-300 rounded text-xs sm:text-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Courses;