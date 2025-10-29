// import './App.css';
// import React from 'react'
// import axios from 'axios';
// import { useState, useEffect } from 'react';
// import TweetList from './components/TweetList'
// import CreateTweet from './components/CreateTweet';
// import './components/CreateTweet.css'
// import './components/TweetList.css'

// const App = () => {
//   const [tweetList, setTweetList] = useState([])
//   const [error, setError] = useState(false)

//   useEffect(() => {
//     const getAllTweets = async () => {
//       try {
//         const res = await axios.get('https://micro-blogging-dot-full-stack-course-services.ew.r.appspot.com/tweet')
//         // console.log(res.data.tweets)
//         setTweetList(res.data.tweets)
    
  
//       } catch (err) {
//         setError(err.message);
//       }
//     };
  
//     getAllTweets();
   
    
  
//   }, []);

//   const addTweet = async (newTweet) => {
//     try {
//       newTweet.date = new Date().toISOString()
//       const res = await axios.post('https://micro-blogging-dot-full-stack-course-services.ew.r.appspot.com/tweet', newTweet)
//       const newTweetList = [res.data,...tweetList]
//       setTweetList(newTweetList)
//     }catch(err){
//       console.log(err);
//       setError(err.message);
//     }
//   }
//   return (
//     <div className='App'>
//       <CreateTweet addTweet={addTweet}/>

//       <TweetList tweetList ={tweetList}/>

//       {error && <h3>{error}</h3>}

//     </div>
//   )
// }

// export default App













import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TweetList from './components/TweetList';
import CreateTweet from './components/CreateTweet';
import Login from './pages/Login';
import Nav from './pages/Nav';
import './pages/Login.css';
import './pages/Nav.css';


const App = () => {
  const [tweetList, setTweetList] = useState([]);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getAllTweets = async () => {
      try {
        const res = await axios.get('https://micro-blogging-dot-full-stack-course-services.ew.r.appspot.com/tweet');
        setTweetList(res.data.tweets);
      } catch (err) {
        setError(err.message);
      }
    };

    getAllTweets();
  }, []);

  const addTweet = async (newTweet) => {
    try {
      newTweet.date = new Date().toISOString();
      const res = await axios.post('https://micro-blogging-dot-full-stack-course-services.ew.r.appspot.com/tweet', newTweet);
      const newTweetList = [res.data, ...tweetList];
      setTweetList(newTweetList);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogin = (username) => {
    setUser({ username });
  };

  return (
    <Router>
      <div className='App'>
        <Nav user={user} />
        <Routes>
          <Route
            path='/home'
            element={
              user ? (
                <CreateTweet addTweet={addTweet} user={user} />
              ) : (
                <Navigate to='/login' />
              )
            }
          />
          <Route
            path='/login'
            element={<Login onLogin={handleLogin} />}
          />
        </Routes>
        {user && <TweetList tweetList={tweetList} />}
        {error && <h3>{error}</h3>}
      </div>
    </Router>
  );
};

export default App;
