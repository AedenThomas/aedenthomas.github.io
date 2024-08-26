import React from 'react';

const NightMode = ({ toggleMode }) => {
  return (
    <section className="bg-black text-white py-24">
      <div className="container mx-auto text-center">
        <div className="inline-block mb-6 p-6 bg-gray-800 rounded-lg shadow-lg">
          {/* Image and content will go here */}
          <h3 className="text-4xl font-bold mb-4">NIGHT MODE</h3>
          <p className="font-light text-gray-400">Twilight Edition</p>
        </div>
        <button className="mt-6 px-6 py-2 bg-white text-black font-bold rounded-full transition-colors duration-300 hover:bg-gray-200">VIEW</button>
      </div>
    </section>
  );
};

export default NightMode;
