
import React from 'react';

const TweetList = ({ tweets }) => {
  return (
    <div className='tweet'>    
      <ul>
        {tweets.map((tweet) => (
          <li key={tweet.id} className="tweet-item">
            <div className="tweet-content">
              <div className="info">
                <p>{tweet.username}</p>  <p>{new Date(tweet.timestamp).toLocaleString()}</p>
              </div>
              <div className="text">
                {tweet.text}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TweetList;

