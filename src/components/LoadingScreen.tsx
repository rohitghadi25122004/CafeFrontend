import React from 'react';

const LoadingScreen: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
            <div className="relative">
                {/* Animated outer ring */}
                <div className="absolute inset-0 -m-4 border-4 border-yellow-400/30 rounded-full animate-ping"></div>
                <div className="absolute inset-0 -m-4 border-2 border-yellow-200 rounded-full animate-pulse"></div>

                {/* Logo Container */}
                <div className="relative bg-white p-4 rounded-full shadow-2xl animate-bounce-slow">
                    <img
                        src="/logo.webp"
                        alt="Cafe Logo"
                        className="w-24 h-24 object-contain animate-float"
                    />
                </div>
            </div>

            {/* Loading Text */}
            <div className="mt-8 flex flex-col items-center gap-2">
                <h2 className="text-xl font-bold text-gray-800 animate-pulse">
                    Something Special Coming Up...
                </h2>
                <div className="flex gap-1">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
