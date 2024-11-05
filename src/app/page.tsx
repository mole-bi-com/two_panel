import Link from 'next/link'
import { NavBar } from '@/components/nav-bar'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            English to Korean Script Translator
          </h1>
          
          <div className="max-w-3xl mx-auto">
            <p className="text-xl text-gray-600 mb-8">
              Translate lengthy English scripts into Korean with high accuracy using AI
            </p>
            
            <Link
              href="/scripts/new"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Start New Translation
            </Link>
          </div>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900">Recent Scripts</h3>
              <p className="mt-2 text-gray-600">No scripts yet</p>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900">Vocabulary List</h3>
              <p className="mt-2 text-gray-600">No saved words yet</p>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900">Translation Stats</h3>
              <p className="mt-2 text-gray-600">No translations completed</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
