import React from 'react';

const CreateTweet = ({ tweetText, onTweetChange, onTweetSubmit }) => {
  return (
    <div className='create'>
      <div className="tweet-container">
        <div className="input-wrapper">

        <textarea

         value={tweetText}
         onChange={onTweetChange}
         placeholder=" What have you in mind..."
         maxLength={140}/>
          <div className="input-controls">
            <p className="count">{tweetText.length}</p>
            <button onClick={onTweetSubmit} disabled={tweetText.length > 140}>
              Tweet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTweet;




