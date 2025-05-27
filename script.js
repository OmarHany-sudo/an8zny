document.addEventListener('DOMContentLoaded', () => {
    const situationSelect = document.getElementById('situation');
    const getResponseBtn = document.getElementById('getResponse');
    const customSituation = document.getElementById('customSituation');
    const getCustomResponseBtn = document.getElementById('getCustomResponse');
    const responseBox = document.getElementById('responseBox');
    const copyResponseBtn = document.getElementById('copyResponse');
    const toast = document.getElementById('toast');

    // تحميل الردود من ملف JSON
    fetch('responses.json')
        .then(response => response.json())
        .then(data => {
            const responses = data;

            // وظيفة لاختيار رد عشوائي من فئة معينة
            function getRandomResponse(category) {
                if (category && responses[category]) {
                    const responseList = responses[category];
                    return responseList[Math.floor(Math.random() * responseList.length)];
                }
                return 'لم يتم العثور على رد مناسب!';
            }

            // التعامل مع زر "احصل على رد"
            getResponseBtn.addEventListener('click', () => {
                const selectedSituation = situationSelect.value;
                if (selectedSituation) {
                    const randomResponse = getRandomResponse(selectedSituation);
                    responseBox.textContent = randomResponse;
                    responseBox.classList.remove('hidden');
                    copyResponseBtn.classList.remove('hidden');
                } else {
                    responseBox.textContent = 'يرجى اختيار موقف!';
                    responseBox.classList.remove('hidden');
                    copyResponseBtn.classList.add('hidden');
                }
            });

            // التعامل مع زر "احصل على رد مخصص"
            getCustomResponseBtn.addEventListener('click', () => {
                const description = customSituation.value.trim();
                if (description) {
                    // تحليل الكلمات المفتاحية
                    const category = analyzeDescription(description);
                    const randomResponse = getRandomResponse(category);
                    responseBox.textContent = randomResponse;
                    responseBox.classList.remove('hidden');
                    copyResponseBtn.classList.remove('hidden');
                } else {
                    responseBox.textContent = 'يرجى كتابة وصف للموقف!';
                    responseBox.classList.remove('hidden');
                    copyResponseBtn.classList.add('hidden');
                }
            });

            // التعامل مع زر "نسخ الرد"
            copyResponseBtn.addEventListener('click', () => {
                if (responseBox.textContent && !responseBox.textContent.includes('يرجى')) {
                    navigator.clipboard.writeText(responseBox.textContent)
                        .then(() => {
                            toast.classList.remove('hidden');
                            setTimeout(() => {
                                toast.classList.add('hidden');
                            }, 2000);
                        })
                        .catch(err => console.error('فشل النسخ: ', err));
                }
            });

            // وظيفة تحليل الوصف لاختيار الفئة المناسبة
            function analyzeDescription(description) {
                const lowerDesc = description.toLowerCase();
                if (lowerDesc.includes('رفض') || lowerDesc.includes('مش عايز') || lowerDesc.includes('ما اقدرش')) {
                    return 'رفض';
                } else if (lowerDesc.includes('محرج') || lowerDesc.includes('إحراج') || lowerDesc.includes('محرجة')) {
                    return 'احراج';
                } else if (lowerDesc.includes('آسف') || lowerDesc.includes('اعتذر') || lowerDesc.includes('سامحني')) {
                    return 'اعتذار';
                } else if (lowerDesc.includes('شكر') || lowerDesc.includes('ممنون') || lowerDesc.includes('شاكر')) {
                    return 'شكر';
                } else if (lowerDesc.includes('مدح') || lowerDesc.includes('ممتاز') || lowerDesc.includes('رائع')) {
                    return 'مدح';
                } else if (lowerDesc.includes('تعزية') || lowerDesc.includes('وفاة') || lowerDesc.includes('خسارة')) {
                    return 'تعزية';
                } else if (lowerDesc.includes('تهنئة') || lowerDesc.includes('مبروك') || lowerDesc.includes('فرح')) {
                    return 'تهنئة';
                }
                return 'اعتذار'; // فئة افتراضية إذا لم يتم التعرف على الفئة
            }
        })
        .catch(err => console.error('فشل تحميل الردود: ', err));
});