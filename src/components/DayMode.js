import React from 'react';

const DayMode = ({ toggleMode }) => {
  return (
    <section className="bg-white text-black py-24">
      <div className="container mx-auto text-center">
        <div className="inline-block mb-6 p-6 bg-gray-200 rounded-lg shadow-lg">
          {/* Image and content will go here */}
          <h3 className="text-4xl font-bold mb-4">DAY MODE</h3>
          <p className="font-light text-gray-600">Sunshine Edition</p>
        </div>
        <button
          className="mt-6 px-6 py-2 bg-black text-white font-bold rounded-full transition-colors duration-300 hover:bg-gray-900"
          onClick={toggleMode}
        >
          VIEW
        </button>
      </div>
    </section>
  );
};

export default DayMode;