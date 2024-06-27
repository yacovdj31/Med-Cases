// import React, { useState } from 'react';
// import Chatbot from './Chatbot';
// import ItemUsage from './ItemUsage';
// import Application from './Application';
// import "./App.css";
// import Order from './Order';
// import CheckVitals from './CheckVitals';
// import VitalsInput from './VitalsInput';

// const App = () => {
//     const [itemUsage, setItemUsage] = useState({});

//     return (
//         <div>
//             <Chatbot />
//             <ItemUsage setItemUsage={setItemUsage} />
//             <Application itemUsage={itemUsage} />
//             <Order/>
//             <CheckVitals />
//             <VitalsInput />
//         </div>
//     );
// };

// export default App;



// import React from 'react';
// import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
// import ChatbotPage from './ChatbotPage';
// import SummaryPage from './SummaryPage';
// import "./App.css";

// const App = () => {
//     return (
//         <Router>
//             <Routes>
//                 <Route path="/" element={<ChatbotPage />} />
//                 <Route path="/summary" element={<SummaryPage />} />
//             </Routes>
//         </Router>
//     );
// };

// export default App;


// import React, { useState } from 'react';
// import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
// import ChatbotPage from './ChatbotPage';
// import ItemUsagePage from './ItemUsagePage';
// import ApplicationPage from './ApplicationPage';
// import SummaryPage from './SummaryPage';
// import "./App.css";

// const App = () => {
//     const [itemUsage, setItemUsage] = useState({});

//     return (
//         <Router>
//             <Routes>
//                 <Route path="/" element={<ChatbotPage />} />
//                 <Route path="/item-usage" element={<ItemUsagePage itemUsage={itemUsage} setItemUsage={setItemUsage} />} />
//                 <Route path="/application" element={<ApplicationPage itemUsage={itemUsage} />} />
//                 <Route path="/summary" element={<SummaryPage />} />
//             </Routes>
//         </Router>
//     );
// };

// export default App;



import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ChatbotPage from './pages/ChatbotPage';
import ItemUsagePage from './pages/ItemUsagePage';
import ApplicationPage from './pages/ApplicationPage';
import OrderPage from './pages/OrderPage';
import CheckVitalsPage from './pages/CheckVitalsPage';
import VitalsInputPage from './pages/VitalsInputPage';
import SummaryPage from './components/SummaryPage';
import "./App.css";

const App = () => {
    const [itemUsage, setItemUsage] = useState({});

    return (
        <Router>
            <Routes>
                <Route path="/" element={<ChatbotPage />} />
                <Route path="/item-usage" element={<ItemUsagePage itemUsage={itemUsage} setItemUsage={setItemUsage} />} />
                <Route path="/application" element={<ApplicationPage itemUsage={itemUsage} />} />
                <Route path="/order" element={<OrderPage />} />
                <Route path="/check-vitals" element={<CheckVitalsPage />} />
                <Route path="/vitals-input" element={<VitalsInputPage />} />
                <Route path="/summary" element={<SummaryPage />} />
            </Routes>
        </Router>
    );
};

export default App;
