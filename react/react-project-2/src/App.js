// import React, { useState, useEffect } from 'react';
// import CreateTweet from './components/CreateTweet/CreateTweet';
// import TweetList from './components/TweetList/TweetList';
// import './App.css'
// import './components/CreateTweet/CreateTweet.css';
// import './components/TweetList/TweetList.css';

// const App = () => {
//   const [tweetText, setTweetText] = useState('');
//   const [tweets, setTweets] = useState([]);

//   useEffect(() => {
//     const savedTweets = JSON.parse(localStorage.getItem('tweets')) || [];
//     setTweets(savedTweets);
//   }, []);

//   useEffect(() => {
//     localStorage.setItem('tweets', JSON.stringify(tweets));
//   }, [tweets]);

//   const handleTweetChange = (event) => {
//     setTweetText(event.target.value);
//   };

//   const handleTweetSubmit = () => {
//     if (tweetText.length > 0) {
//       const newTweet = {
//         id: Date.now(),
//         username: 'Yacov',
//         text: tweetText,
//         timestamp: new Date().toISOString(),
//       };

//       setTweets([newTweet, ...tweets]);
//       setTweetText('');
//     }
//   };

//   return (
//     <div>
      
//       <CreateTweet
//         tweetText={tweetText}
//         onTweetChange={handleTweetChange}
//         onTweetSubmit={handleTweetSubmit}
//       />
//       <TweetList tweets={tweets} />
//     </div>
//   );
// };

// export default App;


import './App.css';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import HomePage from './room/HomePage';
import AboutPage from './room/AboutPage';
import ProductPage from './room/ProductPage';
import Nav from './class/Nav';
import { useState } from 'react';
import SingleProductPage from './room/SingleProductPage';
import Login from './class/Login';
import PrivateRoute from './class/PrivateRoute';

function App() {
  const [user, setUser] = useState(false);
  const [isLoggedin, setIsLoggedin] = useState(false);

  return (
    <div className='App'>
      <Nav user={user} />
      <Routes>
        <Route path='/' element={<Login setUser={setUser} setIsLoggedin={setIsLoggedin} />} />
        <Route
          path='/home'
          element={
            <PrivateRoute isLoggedin={isLoggedin}>
              <HomePage user={user} />
            </PrivateRoute>
          }
        />
        <Route
          path='/about'
          element={
            <PrivateRoute isLoggedin={isLoggedin}>
              <AboutPage />
            </PrivateRoute>
          }
        />
        <Route path='/product/:id' element={<SingleProductPage />} />
      </Routes>
      <h1>Footer</h1>
    </div>
  );
}

export default App;


