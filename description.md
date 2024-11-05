# English-to-Korean Script Translation Application - Project Description

## Overview

An advanced translation application specifically designed to convert lengthy English scripts into Korean with high accuracy and efficiency. The application handles extremely long text inputs, such as 2-3 hour YouTube video scripts, which users paste directly into the application. It intelligently segments large texts, ensures natural and context-aware translations using ChatGPT, and provides a side-by-side interface for easy comparison and navigation.

---

## 1. Core Features

### 1.1 User Authentication

- **Secure Login System**
  - Gmail authentication implemented
  - OAuth integration with Google for seamless sign-in
  - Session management with Supabase Auth
  - Protected routes with middleware

### 1.2 Script Input and Management

- **Direct Text Input**
  - Users can paste very long English scripts directly into the application
  - Timestamp format detection and parsing (HH:MM:SS or MM:SS)
  - Timestamp information used as context for translation, not stored in DB
  - Script title and content management

- **Intelligent Text Segmentation**
  - Automated splitting of large scripts into manageable chunks
  - Context preservation between chunks including timestamp information
  - Optimized chunk size (8000 tokens) for better translation quality
  - Timestamp-aware translation prompts for better context understanding

### 1.3 Translation Engine

- **High-Quality Translation with ChatGPT**
  - Integration with OpenAI GPT-4 API
  - Context-aware translation with timestamp information
  - Timestamp information used to enhance translation accuracy
  - Retry mechanism for failed translations
  - Error handling and validation

- **Real-time Progress Tracking**
  - Visual progress indicator with circular progress bar
  - Step-by-step translation status display
  - Chunk-by-chunk progress tracking
  - Overall progress percentage display

- **Translation Verification**
  - Basic validation of translation completeness
  - Sentence pair matching
  - Translation metrics collection
  - Error detection and reporting

### 1.4 Dual-Panel Viewer

- **Interactive Interface**
  - Side-by-side display of original and translated text
  - Synchronized scrolling option
  - Sentence highlighting
  - Timestamp display support

- **Translation Management**
  - Save/Load translations
  - Translation status tracking
  - Automatic progress saving
  - Translation metrics storage

### 1.5 User Interaction and Editing

- **Annotations and Highlights**
  - Ability to highlight text and add personal notes
  - Annotations saved per user and per script
  - Option to share annotations with other users or keep them private

- **Performance Optimization**
  - Efficient processing to reduce waiting time for translation results
  - Utilizes timestamp information to prioritize and display translated sections
  - Predictive preloading of upcoming sections to enhance seamless reading

[Future Features - In Development]
- Vocabulary Management
- Advanced Translation Verification
- User Feedback System
- Performance Optimization
- Translation History
- Export Functionality

## 2. Technical Architecture

### 2.1 Frontend Architecture
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript for type safety and scalability
- **File Structure**: All new pages should be placed in the `/app` directory
- **State Management**: React hooks and Context API
- **Styling**: Tailwind CSS with custom themes
- **Components**:
  - Client-side Components: For interactive features
  - Server-side Components: For initial data fetching and rendering
- **Responsive Design**: Ensuring usability across devices

### 2.2 Backend Integration

- **Server Environment**: Node.js with Express.js for API endpoints

- **Database**: Supabase (PostgreSQL) for data storage

- **Tables**:
  - `users`: Authentication and profile data
  - `scripts`: Original scripts pasted by users 
  - `sections`: Segmented script content based on chapters or timestamps
  - `translations`: Korean translations of sections
  - `vocabulary`: User-specific vocabulary lists
  - `annotations`: User notes and highlights

- **AI Services**:
  - **ChatGPT Integration**: Utilize OpenAI's ChatGPT API for translation tasks
  - **Text Processing**: Internal services to handle large text inputs efficiently

### 2.3 AI Integration

- **Translation Engine with ChatGPT**
  - Utilize ChatGPT for high-quality English-to-Korean translations
  - Custom prompt engineering to enhance translation naturalness and context awareness
  - Incremental translation processing to display results faster

- **Performance Optimization**
  - Asynchronous processing with job queues for handling large workloads
  - Efficient batching of requests to optimize API usage limits

- **Feedback Loop**
  - System-level improvements based on common user issues
  - Regular updates to translation prompts for enhanced performance

### 2.4 Security

- **Authentication and Authorization**
  - Secure session management with tokens
  - Role-based access control for administrative functions
  - Encryption of sensitive data in transit and at rest

- **Data Protection**
  - Compliance with GDPR and other data privacy regulations
  - Regular security audits and vulnerability assessments

- **Error Handling**
  - Comprehensive logging of errors and system events
  - User-friendly error messages and support links

## 3. UI/UX Design

### 3.1 Design System

- **Color Palette**
  - **Primary**: #2563EB (Blue)
  - **Secondary**: #10B981 (Green)
  - **Accent**: #F59E0B (Amber)
  - **Background**: #FFFFFF (White) and #F3F4F6 (Gray)

- **Typography**
  - Font Family: 'Noto Sans KR' for Korean, 'Inter' for English
  - Clear hierarchy with headings, subheadings, and body text
  - Adequate spacing for readability

### 3.2 Component Design

- **Navigation Bar**
  - Accessible from all pages
  - Includes links to scripts, vocabulary list, settings, and support

- **Script Management**
  - Dashboard displaying pasted scripts and translation progress
  - Options to view or delete scripts

- **Dual-Panel Viewer**
  - Clean interface with minimal distractions
  - Controls for text size adjustment
  - Toggle for night mode to reduce eye strain

- **Interactive Elements**
  - Buttons with hover and active states
  - Modals for vocabulary definitions and annotations
  - Loading spinners during translation processing

### 3.3 Accessibility and Localization

- **Accessibility Features**
  - Keyboard navigation support
  - ARIA labels for screen readers
  - High-contrast mode for visually impaired users

- **Localization Support**
  - UI available in both English and Korean
  - Date and time formats adjusted based on user preferences

## 4. Data Structure

### 4.1 Database Schema

- **scripts**
  - `script_id` (PK)
  - `user_id` (FK)
  - `title`
  - `original_content`
  - `creation_date`

- **sections**
  - `section_id` (PK)
  - `script_id` (FK)
  - `section_number`
  - `english_content`
  - `korean_content`
  - `translation_status` (e.g., pending, in_progress, completed)
  - `metrics` (JSON containing processing metrics)
  - `created_at`
  - `updated_at`

- **vocabulary**
  - `vocab_id` (PK)
  - `user_id` (FK)
  - `word`
  - `definition`
  - `context` (text surrounding the word in the script)
  - `date_added`

- **annotations**
  - `annotation_id` (PK)
  - `section_id` (FK)
  - `user_id` (FK)
  - `content`
  - `position`
  - `created_at`

### 4.2 Relationships

- **One-to-Many**
  - A `user` can have multiple `scripts` and `vocabulary` entries
  - A `script` contains multiple `sections`
  - A `section` can have multiple `annotations` from different `users`

## 5. Additional Features

### 5.1 Enhanced Translation Accuracy

- **Domain-Specific Models**
  - Implement specialized translation prompts for various fields beyond biology
  - Allow users to select the domain of their script for optimized translations

- **Customizable Translation Settings**
  - Users can choose formality levels, tone, and style preferences
  - Option to set persistent preferences for future translations

### 5.2 Performance Improvements

- **Optimized Processing**
  - Utilize parallel processing to handle multiple sections simultaneously
  - Implement predictive preloading of upcoming sections

- **User Notifications**
  - Real-time updates on translation progress
  - Alerts for completed translations or sections ready for review

### 5.3 Interactive Sentence Alignment

- **Sentence Selection Synchronization**
  - Selecting a sentence in the English panel highlights and scrolls to the corresponding Korean sentence
  - Enhances understanding by directly linking source and translated content