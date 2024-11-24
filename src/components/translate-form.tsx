'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const TranslateForm: React.FC<{ scriptId: string }> = ({ scriptId }) => {
  const [translatedContent, setTranslatedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchTranslation = async () => {
      try {
        setLoading(true);
        setError(null);

        // Simulate an API call to get translated content
        const response = await fetch(`/api/get-translation?id=${scriptId}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch translation');
        }

        const data = await response.json();
        setTranslatedContent(data.translatedContent);
      } catch (err) {
        setError('Failed to fetch translation. Please try again.');
        console.error('Fetch translation error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTranslation();
  }, [scriptId]);

  const handleTranslate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/start-translation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scriptId: scriptId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch translation');
      }

      const data = await response.json();
      setTranslatedContent(data.translatedContent);
    } catch (err) {
      setError('Failed to fetch translation. Please try again.');
      console.error('Fetch translation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <pre className="bg-gray-100 p-4 rounded-md whitespace-pre-wrap">{translatedContent}</pre>
      <button onClick={handleTranslate} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">번역 시작</button>
    </div>
  );
};

export default TranslateForm; 