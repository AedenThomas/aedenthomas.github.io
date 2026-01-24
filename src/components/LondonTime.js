import React, { useState, useEffect } from 'react';

const LondonTime = ({ isDarkMode }) => {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const options = {
        timeZone: 'Europe/London',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      };
      const now = new Date();
      setTime(new Intl.DateTimeFormat('en-US', options).format(now));
    };

    updateTime();
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    
    const timeout = setTimeout(() => {
      updateTime();
      const interval = setInterval(updateTime, 60000);
      return () => clearInterval(interval);
    }, msUntilNextMinute);

    return () => clearTimeout(timeout);
  }, []);

  if (!time) return null;

  return (
    <div
      className={`hidden xl:flex items-center gap-1.5 px-2 py-1 rounded-full text-[12px] font-mono tracking-wider border ${
        isDarkMode 
          ? 'bg-white/10 border-white/10 text-gray-300' 
          : 'bg-gray-100 border-gray-200 text-gray-600'
      }`}
    >
      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
      <span>LND</span>
      <span>•</span>
      <span>{time}</span>
    </div>
  );
};

export default LondonTime;
