# Document Signer Application

A PDF document management and signing application built with Next.js.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build && npm run start
```

## Core Functionality

### Document Upload
The application allows users to upload PDF documents through a drag-and-drop interface or a file selection dialog. Once uploaded, the document is displayed in the viewport, providing an interactive experience for users.

### Annotation Features
The application supports various annotation capabilities, enhancing document interaction. Users can:
- Highlight text with customizable colors
- Underline text with customizable colors
- Attach comments to specific parts of the document
- Draw signatures anywhere on the document

### Document Export
The system ensures that all annotations and signatures are properly embedded in the exported document. Users can export the annotated document as a high-quality PDF, maintaining the integrity and clarity of the original document.

## Technical Implementation

### Framework and Architecture
The application is built using Next.js, leveraging its server-side rendering capabilities to enhance performance. A single-page application (SPA) design is implemented to ensure smooth, real-time interactions without requiring page reloads. The user interface is designed to be responsive, adapting seamlessly to different screen sizes while maintaining an intuitive and professional user experience.

### Technologies Used

- **Next.js 13**: Chosen for its App Router and React Server Components, allowing for efficient server-side rendering and static generation.
- **Radix UI**: Utilized for accessible UI components, ensuring compliance with usability standards.
- **react-pdf v9**: Integrated for rendering and manipulating PDFs in a React-based environment, facilitating seamless document interactions.
- **PDF.js**: Employed for PDF parsing and worker management, providing fine-grained control over document processing, including rendering and annotation features.
- **Tailwind CSS**: Used for styling with atomic CSS, enabling rapid development and consistent design.
- **shadcn/ui**: Implemented as a UI component library to provide prebuilt, customizable components that enhance the application's visual appeal and usability.

### PDF Worker Configuration
One of the key technical challenges in building this application was configuring the PDF.js web worker to properly render PDFs within the Next.js environment. The solution involved:

1. Modifying `next.config.js` to set up a custom Webpack configuration:
```js
webpack: (config) => {
  config.resolve.alias.canvas = false;
  config.plugins.push(
    new webpack.ProvidePlugin({
      PDFWorker: 'pdfjs-dist/build/pdf.worker.js'
    })
  );
  return config;
}
```

2. Registering the worker in the document viewer components:
```tsx
import { GlobalWorkerOptions } from 'pdfjs-dist';
GlobalWorkerOptions.workerSrc = '/pdf.worker.js';
```

## Enhancements and Future Scope
The application is designed with extensibility in mind, allowing for potential enhancements such as:

- **Digital Signatures**: Implementing cryptographic signing and validation to ensure document authenticity.
- **Advanced Document Annotations**: Expanding annotation capabilities to include threaded comment discussions and enhanced markup tools.
- **Multi-file Workflows**: Enabling batch processing and document comparison functionalities to improve efficiency in handling multiple documents.


##Accessing the document web app. 
To access the document signer and annotation tool, it was hosted on netlify and can be accessed via the link below: 
https://lively-marigold-287e44.netlify.app/



