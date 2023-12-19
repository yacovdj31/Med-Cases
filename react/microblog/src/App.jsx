import React, { useState, useEffect } from 'react';
import CreateTweet from './components/CreateTweet/CreateTweet';
import TweetList from './components/TweetList/TweetList';
import './App.css'
import './components/CreateTweet/CreateTweet.css';
import './components/TweetList/TweetList.css';

const App = () => {
  const [tweetText, setTweetText] = useState('');
  const [tweets, setTweets] = useState([]);

  useEffect(() => {
    const savedTweets = JSON.parse(localStorage.getItem('tweets')) || [];
    setTweets(savedTweets);
  }, []);

  useEffect(() => {
    localStorage.setItem('tweets', JSON.stringify(tweets));
  }, [tweets]);

  const handleTweetChange = (event) => {
    setTweetText(event.target.value);
  };

  const handleTweetSubmit = () => {
    if (tweetText.length > 0) {
      const newTweet = {
        id: Date.now(),
        username: 'Yacov',
        text: tweetText,
        timestamp: new Date().toISOString(),
      };

      setTweets([newTweet, ...tweets]);
      setTweetText('');
    }
  };

  return (
    <div>
      
      <CreateTweet
        tweetText={tweetText}
        onTweetChange={handleTweetChange}
        onTweetSubmit={handleTweetSubmit}
      />
      <TweetList tweets={tweets} />
    </div>
  );
};

export default App;


