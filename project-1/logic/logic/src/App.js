import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import MathPage from './pages/MathPage';
import ScramblePage from './pages/ScramblePage';

function App() {
  return (
  //   <Router>
  //     <div>
  //       {/* Navigation Links */}
  //       <nav>
  //         <ul>
  //           <li>
  //             <Link to="/">Home</Link>
  //           </li>
  //           <li>
  //             <Link to="/math">Math Page</Link>
  //           </li>
  //           <li>
  //             <Link to="/scramble">Scramble Page</Link>
  //           </li>
  //         </ul>
  //       </nav>

  //       {/* Route Configuration */}
  //       <Routes>
  //         <Route path="/" element={<Home />} />
  //         <Route path="/math" element={<MathPage />} />
  //         <Route path="/scramble" element={<ScramblePage />} />
  //       </Routes>
  //     </div>
  //   </Router>

  
//   <Router>
//   <div className="App">
//     <div className="content">
//       <Routes>
//         <Route path="/" element={<Home />} />
//         <Route path="/mathPage" element={<MathPage />} />
//         <Route path="/scramblePage" element={<ScramblePage />} />
//       </Routes>
//     </div>
//   </div>
// </Router>



  );
}

export default App;




// // import React from 'react';
// // import './App.css';
// // import Home from './components/Home';
// // import ScramblePage from './pages/ScramblePage'; // Renamed for clarity and potential typo fix
// // import MathPage from './pages/MathPage'; // Renamed to avoid potential reserved word conflict

// // import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

// // function App() {
// //   return (
// //     <Router>
// //       <div className="App">
// //         <Routes>
// //           <Route path='/' element={<Home/>} />
// //           <Route path='/math' element={<MathPage/>}/> {/* Updated component name */}
// //           <Route path='/scramble' element={<ScramblePage/>}/> {/* Updated path and component name */}
// //         </Routes>
// //       </div>
// //     </Router>
// //   );
// // }

// // export default App;

// // import { Route, Routes } from 'react-router-dom';
// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import "./App.css";
// import Home from "./components/Home";
// import ScramblePage from "./pages/ScramblePage";
// import MathPage from "./pages/MathPage";

// function App() {
//   return (
//     <div>
//       <BrowserRouter>
//         <Routes>
//           {/* <Route path="/" element={<Home />} /> */}
//           <Route path="/math" element={<MathPage />} />
//           <Route path="/scramble" element={<ScramblePage />} />
//         </Routes>
//       </BrowserRouter>
//     </div>
//   );
// }

// export default App;


// import { Route, Routes } from 'react-router-dom';
// import './App.css';
// import Home from './components/Home';
// import MathPage from './pages/MathPage';
// import ScramblePage from './pages/ScramblePage';

// function App() {
//   return (
//     <div>
//       <MathPage/>
//       <ScramblePage/>
//     </div>
//   );
// }

// export default App;

{/* <Routes>
  <Route path='/' element={<Home/>} />
  <Route path='/math' element={<MathPage/>}/>
  <Route path='/scramble' element={<ScramblePage/>}/>
</Routes> */}
{/* <Home/> */}
{/* <MathPage/> */}

// import React from 'react';
// import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
// import './App.css';
// import Home from './components/Home';
// import MathPage from './pages/MathPage';
// import ScramblePage from './pages/ScramblePage';

// function App() {
//   return (
//     <Router>
//       <div>
//         {/* Navigation Links */}
//         <nav>
//           <ul>
//             <li>
//               <Link to="/">Home</Link>
//             </li>
//             <li>
//               <Link to="/math">Math Page</Link>
//             </li>
//             <li>
//               <Link to="/scramble">Scramble Page</Link>
//             </li>
//           </ul>
//         </nav>

//         {/* Route Configuration */}
//         <Routes>
//           <Route path="/" element={<Home />} />
//           <Route path="/math" element={<MathPage />} />
//           <Route path="/scramble" element={<ScramblePage />} />
//         </Routes>
//       </div>
//     </Router>
//   );
// }

// export default App;
