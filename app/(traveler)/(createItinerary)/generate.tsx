// import React, { useState } from 'react';
// import { View, Text, ScrollView, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import StepIndicator from 'react-native-step-indicator';
// import API_URL from '../../../constants/api';
// // Step components
// import Step1ExperienceDetails from './(manual)/Step1SelectLocation';
// import Step2Availability from './(manual)/Step2ItineraryDetails';
// import Step3Tags from './(manual)/Step3AddItems';
// import Step4Destination from './(manual)/Step4Review';
// import Step5Images from './(manual)/Step5Images';
// import ReviewSubmit from './(manual)/Step4Submit';

// // Types
// import { ExperienceFormData } from '../../../types/types';


// // Progress bar component
// interface ProgressBarProps {
//     currentStep: number;
//     totalSteps: number;
//     labels?: string[];
// }

// const ProgressBar: React.FC<ProgressBarProps> = React.memo(({ currentStep, totalSteps, labels = [] }) => {
//     return (
//         <View className="px-6 my-4">
//             <StepIndicator
//                 customStyles={loadingBarStyles}
//                 currentPosition={currentStep - 1}
//                 stepCount={totalSteps}
//                 labels={labels}
//             />
//         </View>
//     );
// });


// const ExperienceCreationForm: React.FC = () => {
//     const [step, setStep] = useState<number>(1);
//     const stepCount = 6;
//     const [isSubmitting, setIsSubmitting] = useState(false);

//     const [formData, setFormData] = useState<ExperienceFormData>({
//         title: '',
//         description: '',
//         price: '',
//         unit: '',
//         availability: [],
//         tags: [],
//         useExistingDestination: true,
//         destination_id: null,
//         destination_name: '',
//         city: '',
//         destination_description: '',
//         latitude: '',
//         longitude: '',
//         images: [],
//     });

//     // Step navigation
//     const handleNext = () => setStep((prev) => Math.min(prev + 1, stepCount));
//     const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));

//     const validateFormData = () => {
//         const requiredUnits = ['Entry', 'Hour', 'Day', 'Package'];

//         if (
//             !formData.title ||
//             !formData.description ||
//             !formData.price ||
//             isNaN(Number(formData.price)) ||
//             !requiredUnits.includes(formData.unit) ||
//             !Array.isArray(formData.tags) ||
//             formData.tags.length === 0 ||
//             !Array.isArray(formData.availability) ||
//             formData.availability.length === 0 ||
//             formData.availability.some(
//                 slot =>
//                     !slot.day_of_week ||
//                     !slot.start_time ||
//                     !slot.end_time
//             )
//         ) {
//             return false;
//         }

//         if (!formData.useExistingDestination) {
//             if (
//                 !formData.destination_name ||
//                 !formData.city ||
//                 !formData.destination_description ||
//                 !formData.latitude ||
//                 !formData.longitude
//             ) {
//                 return false;
//             }
//         }

//         return true;
//     };

//     const handleSubmit = async (status = 'draft') => {
//         if (!validateFormData()) {
//             Alert.alert('Validation Error', 'Please fill out all required fields.');
//             return;
//         }

//         try {
//             setIsSubmitting(true);

//             // Create FormData object for multipart/form-data
//             const formDataObj = new FormData();

//             // Add text fields
//             formDataObj.append('creator_id', '12'); // replace with actual creator ID
//             formDataObj.append('title', formData.title);
//             formDataObj.append('description', formData.description);
//             formDataObj.append('price', Number(formData.price).toString());
//             formDataObj.append('unit', formData.unit);
//             formDataObj.append('status', status); // Set status based on button clicked

//             // Rest of your form data preparation...
//             formDataObj.append('tags', JSON.stringify(formData.tags));
//             formDataObj.append('availability', JSON.stringify(formData.availability));

//             // Handle destination data
//             if (formData.useExistingDestination && formData.destination_id) {
//                 formDataObj.append('destination_id', formData.destination_id.toString());
//             } else {
//                 formDataObj.append('destination_name', formData.destination_name);
//                 formDataObj.append('city', formData.city);
//                 formDataObj.append('destination_description', formData.destination_description);
//                 formDataObj.append('latitude', formData.latitude);
//                 formDataObj.append('longitude', formData.longitude);
//             }

//             // Add image files - FIXED: Use the correct field name 'image' instead of 'photos'
//             if (formData.images && formData.images.length > 0) {
//                 formData.images.forEach((img, index) => {
//                     // Check if img is a string or an object
//                     if (typeof img === 'string') {
//                         // Handle legacy format (just uri string)
//                         const uriParts = img.split('/');
//                         const name = uriParts[uriParts.length - 1];
//                         const fileExtension = name.split('.').pop() || '';
//                         const type = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;

//                         // Create a file object with necessary properties for React Native FormData
//                         const fileObj: any = {
//                             uri: img,
//                             name,
//                             type,
//                         };
//                         formDataObj.append('images', fileObj as any);  // Changed from 'photos' to 'image'
//                     } else {
//                         // Handle new format (object with uri, name, type)
//                         const fileObj: any = {
//                             uri: img.uri,
//                             name: img.name || `image${index}.jpg`,
//                             type: img.type || 'image/jpeg',
//                         };
//                         formDataObj.append('images', fileObj as any);  // Changed from 'photos' to 'image'
//                     }
//                 });
//             }

//             console.log('Submitting form data:', formDataObj);


//             // Your API call and response handling
//             const response = await fetch(`${API_URL}/experience/create`, {
//                 method: 'POST',
//                 headers: {
//                     'Accept': 'application/json',
//                 },
//                 body: formDataObj,
//             });

//             // Your existing response handling
//             // ...

//             const successMessage = status === 'active'
//                 ? 'Experience published successfully!'
//                 : 'Experience saved as draft successfully!';

//             Alert.alert('Success', successMessage);
//             // Navigation or reset logic here

//         } catch (err) {
//             console.error('Submit error:', err);
//             Alert.alert('Error');
//         } finally {
//             setIsSubmitting(false);
//         }
//     };

//     //     if (!validateFormData()) {
//     //         Alert.alert('Validation Error', 'Please fill out all required fields.');
//     //         return;
//     //     }

//     //     try {
//     //         setIsSubmitting(true);

//     //         // Create FormData object for multipart/form-data
//     //         const formDataObj = new FormData();

//     //         // Add text fields
//     //         formDataObj.append('creator_id', '12'); // replace with actual creator ID
//     //         formDataObj.append('title', formData.title);
//     //         formDataObj.append('description', formData.description);
//     //         formDataObj.append('price', Number(formData.price).toString());
//     //         formDataObj.append('unit', formData.unit);
//     //         formDataObj.append('status', 'draft'); // default status

//     //         // Add tags as a JSON string
//     //         formDataObj.append('tags', JSON.stringify(formData.tags));

//     //         // formData.append('tags', JSON.stringify(tags));

//     //         // Add availability as a JSON string
//     //         formDataObj.append('availability', JSON.stringify(formData.availability));

//     //         // Handle destination data
//     //         if (formData.useExistingDestination && formData.destination_id) {
//     //             formDataObj.append('destination_id', formData.destination_id.toString());
//     //         } else {
//     //             formDataObj.append('destination_name', formData.destination_name);
//     //             formDataObj.append('city', formData.city);
//     //             formDataObj.append('destination_description', formData.destination_description);
//     //             formDataObj.append('latitude', formData.latitude);
//     //             formDataObj.append('longitude', formData.longitude);
//     //         }

//     //         // Add image files - FIXED: Use the correct field name 'image' instead of 'photos'
//     //         if (formData.images && formData.images.length > 0) {
//     //             formData.images.forEach((img, index) => {
//     //                 // Check if img is a string or an object
//     //                 if (typeof img === 'string') {
//     //                     // Handle legacy format (just uri string)
//     //                     const uriParts = img.split('/');
//     //                     const name = uriParts[uriParts.length - 1];
//     //                     const fileExtension = name.split('.').pop() || '';
//     //                     const type = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;

//     //                     // Create a file object with necessary properties for React Native FormData
//     //                     const fileObj: any = {
//     //                         uri: img,
//     //                         name,
//     //                         type,
//     //                     };
//     //                     formDataObj.append('images', fileObj as any);  // Changed from 'photos' to 'image'
//     //                 } else {
//     //                     // Handle new format (object with uri, name, type)
//     //                     const fileObj: any = {
//     //                         uri: img.uri,
//     //                         name: img.name || `image${index}.jpg`,
//     //                         type: img.type || 'image/jpeg',
//     //                     };
//     //                     formDataObj.append('images', fileObj as any);  // Changed from 'photos' to 'image'
//     //                 }
//     //             });
//     //         }

//     //         console.log('Submitting form data:', formDataObj);

//     //         // Make multipart form-data request
//     //         const response = await fetch(`${API_URL}/experience/create`, {
//     //             method: 'POST',
//     //             headers: {
//     //                 'Accept': 'application/json',
//     //                 // Don't set Content-Type as FormData will set it with the correct boundary
//     //             },
//     //             body: formDataObj,
//     //         });

//     //         // Check response type and handle errors
//     //         const contentType = response.headers.get('content-type');

//     //         if (!response.ok) {
//     //             let errorMessage = 'Failed to create experience';

//     //             if (contentType && contentType.includes('application/json')) {
//     //                 const errorData = await response.json();
//     //                 errorMessage = errorData.message || errorMessage;
//     //             } else {
//     //                 // For HTML error responses or other non-JSON responses
//     //                 const errorText = await response.text();
//     //                 console.error('Server error response:', errorText);

//     //                 // Try to extract error message from HTML if possible
//     //                 if (errorText.includes('MulterError')) {
//     //                     errorMessage = 'File upload error: ' +
//     //                         (errorText.includes('Unexpected field') ?
//     //                             'Server is expecting different field names for files' :
//     //                             'Unknown file upload error');
//     //                 }
//     //             }

//     //             throw new Error(errorMessage);
//     //         }

//     //         // Handle success response
//     //         let data;
//     //         if (contentType && contentType.includes('application/json')) {
//     //             data = await response.json();
//     //             console.log('Success response:', data);
//     //         } else {
//     //             const text = await response.text();
//     //             console.log('Success response (non-JSON):', text);
//     //         }

//     //         Alert.alert('Success', 'Experience created successfully!');
//     //         // You might want to navigate away or reset the form here

//     //     } catch (err) {
//     //         console.error('Submit error:', err);
//     //         Alert.alert('Error');
//     //     } finally {
//     //         setIsSubmitting(false);
//     //     }
//     // };


//     // Render active step component
//     // const renderStep = () => {
//     //     switch (step) {
//     //         case 1:
//     //             return <Step1ExperienceDetails formData={formData} setFormData={setFormData} onNext={handleNext} />;
//     //         case 2:
//     //             return <Step2Availability formData={formData} setFormData={setFormData} onNext={handleNext} onBack={handleBack} />;
//     //         case 3:
//     //             return <Step3Tags formData={formData} setFormData={setFormData} onNext={handleNext} onBack={handleBack} />;
//     //         case 4:
//     //             return <Step4Destination formData={formData} setFormData={setFormData} onNext={handleNext} onBack={handleBack} />;
//     //         case 5:
//     //             return <Step5Images formData={formData} setFormData={setFormData} onNext={handleNext} onBack={handleBack} />;
//     //         case 6:
//     //             // ReviewSubmit has a different interface than the other step components
//     //             return <ReviewSubmit
//     //                 formData={formData}
//     //                 onBack={handleBack}
//     //                 onSubmit={handleSubmit}
//     //                 isSubmitting={isSubmitting}
//     //             />;
//     //         default:
//     //             return null;
//     //     }
//     // };
//     const renderStep = () => {
//         switch (step) {
//             case 1:
//                 return <Step1ExperienceDetails formData={formData} setFormData={setFormData} onNext={handleNext} />;
//             case 2:
//                 return <Step2Availability formData={formData} setFormData={setFormData} onNext={handleNext} onBack={handleBack} />;
//             case 3:
//                 return <Step3Tags formData={formData} setFormData={setFormData} onNext={handleNext} onBack={handleBack} />;
//             case 4:
//                 return <Step4Destination formData={formData} setFormData={setFormData} onNext={handleNext} onBack={handleBack} />;
//             case 5:
//                 return <Step5Images formData={formData} setFormData={setFormData} onNext={handleNext} onBack={handleBack} />;
//             case 6:
//                 // Pass both onSubmit and onSubmitAsDraft to ReviewSubmit
//                 return <ReviewSubmit
//                     formData={formData}
//                     onBack={handleBack}
//                     onSubmit={handleSubmit}
//                     isSubmitting={isSubmitting}
//                 />;
//             default:
//                 return null;
//         }
//     };
//     return (
//         <SafeAreaView className="flex-1 bg-gray-50">
//             {/* Step content */}
//             <View className="flex-1 px-6 py-4">
//                 <ProgressBar currentStep={step} totalSteps={stepCount} />
//                 {renderStep()}
//             </View>
//         </SafeAreaView>
//     );
// };

// // Progress bar styles
// const loadingBarStyles = {
//     // Hide the circles
//     stepIndicatorSize: 0,
//     currentStepIndicatorSize: 0,

//     // Make the separator into a bar
//     separatorStrokeWidth: 6,
//     separatorStrokeUnfinishedWidth: 6,
//     separatorStrokeFinishedWidth: 6,

//     // Colors
//     separatorFinishedColor: '#376a63', // Updated to use an actual color value
//     separatorUnFinishedColor: '#E5E7EB',

//     // Remove labels
//     labelSize: 0,

//     // Additional styles to hide any remaining elements
//     stepStrokeWidth: 0,
//     currentStepStrokeWidth: 0
// };

// export default ExperienceCreationForm;


import { View, Text } from 'react-native'
import React from 'react'

const generate = () => {
    return (
        <View>
            <Text>generate</Text>
        </View>
    )
}

export default generate;