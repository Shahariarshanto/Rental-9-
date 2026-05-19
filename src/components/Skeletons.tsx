import React from 'react';

export const PropertySkeleton = () => (
  <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-50 animate-pulse">
    <div className="h-56 bg-gray-200" />
    <div className="p-5 space-y-3">
      <div className="h-6 bg-gray-200 rounded-lg w-3/4" />
      <div className="h-4 bg-gray-100 rounded-lg w-1/2" />
      <div className="flex gap-2 pt-2">
        <div className="h-5 bg-gray-50 rounded-md w-16" />
        <div className="h-5 bg-gray-50 rounded-md w-16" />
        <div className="h-5 bg-gray-50 rounded-md w-16" />
      </div>
    </div>
  </div>
);

export const PropertyDetailsSkeleton = () => (
  <div className="min-h-screen bg-white animate-pulse">
    <div className="h-[40vh] bg-gray-200" />
    <div className="max-w-3xl mx-auto px-4 -mt-8">
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 space-y-6">
        <div className="flex justify-between">
          <div className="h-6 bg-gray-100 rounded-full w-20" />
          <div className="h-6 bg-gray-100 rounded-full w-24" />
        </div>
        <div className="h-10 bg-gray-200 rounded-xl w-3/4" />
        <div className="h-6 bg-gray-100 rounded-lg w-1/2" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-20 bg-indigo-50 rounded-2xl" />
          <div className="h-20 bg-emerald-50 rounded-2xl" />
        </div>
        <div className="space-y-3">
          <div className="h-6 bg-gray-200 rounded-lg w-1/4" />
          <div className="h-4 bg-gray-100 rounded-lg w-full" />
          <div className="h-4 bg-gray-100 rounded-lg w-full" />
          <div className="h-4 bg-gray-100 rounded-lg w-2/3" />
        </div>
      </div>
    </div>
  </div>
);
