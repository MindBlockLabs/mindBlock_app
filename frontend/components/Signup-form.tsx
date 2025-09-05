// dummy signup form to test input component

'use client';

import React, { useState } from 'react';
import Input from '@/components/ui/Input';

const SignUpForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
  });

  const handleInputChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-[#050C16] rounded-lg">
      <h2 className="text-xl font-semibold text-white mb-6 flex flex-col items-center">
        Create your account
      </h2>
      
      <div className="space-y-4">
        <Input
          type="text"
          placeholder="Username"
          value={formData.username}
          onChange={handleInputChange('username')}
        />
        
        <Input
          type="text"
          placeholder="Full Name"
          value={formData.fullName}
          onChange={handleInputChange('fullName')}
        />
        
        <Input
          type="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleInputChange('email')}
        />
        
        <Input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleInputChange('password')}
        />
      </div>
      
      <button className="w-full md:w-[408px] mt-6 h-12 bg-[#3B82F6] hover:bg-[#2663C7] text-white font-medium rounded-lg transition-colors">
        Sign up
      </button>
    </div>
  );
};

export default SignUpForm;
