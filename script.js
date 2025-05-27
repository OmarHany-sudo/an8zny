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
                return 'لم يتم العثور على رد مناسب! حاول وصف الموقف بتفاصيل أكثر.';
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
                if (responseBox.textContent && !responseBox.textContent.includes('يرجى') && !responseBox.textContent.includes('لم يتم العثور')) {
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

                // قائمة الكلمات المفتاحية لكل فئة مع أوزان
                const keywords = {
                    'رفض': [
                        { word: 'رفض', weight: 3 },
                        { word: 'مش عايز', weight: 2 },
                        { word: 'ما اقدرش', weight: 2 },
                        { word: 'مش هينفع', weight: 2 },
                        { word: 'مش قادر', weight: 1 },
                        { word: 'مش ممكن', weight: 1 }
                    ],
                    'احراج': [
                        { word: 'محرج', weight: 3 },
                        { word: 'إحراج', weight: 3 },
                        { word: 'محرجة', weight: 3 },
                        { word: 'سؤال شخصي', weight: 2 },
                        { word: 'حساس', weight: 1 },
                        { word: 'مش مرتاح', weight: 1 }
                    ],
                    'اعتذار': [
                        { word: 'آسف', weight: 3 },
                        { word: 'اعتذر', weight: 3 },
                        { word: 'سامحني', weight: 3 },
                        { word: 'غلط', weight: 2 },
                        { word: 'زعل', weight: 2 },
                        { word: 'خطأ', weight: 1 }
                    ],
                    'شكر': [
                        { word: 'شكر', weight: 3 },
                        { word: 'ممنون', weight: 3 },
                        { word: 'شاكر', weight: 3 },
                        { word: 'مقدّر', weight: 2 },
                        { word: 'مجهود', weight: 1 },
                        { word: 'تسلم', weight: 1 }
                    ],
                    'مدح': [
                        { word: 'مدح', weight: 3 },
                        { word: 'ممتاز', weight: 3 },
                        { word: 'رائع', weight: 3 },
                        { word: 'إبداع', weight: 2 },
                        { word: 'موهبة', weight: 2 },
                        { word: 'شغل حلو', weight: 1 }
                    ],
                    'تعزية': [
                        { word: 'تعزية', weight: 3 },
                        { word: 'وفاة', weight: 3 },
                        { word: 'خسارة', weight: 3 },
                        { word: 'حزن', weight: 2 },
                        { word: 'فقدان', weight: 2 },
                        { word: 'البقاء لله', weight: 1 }
                    ],
                    'تهنئة': [
                        { word: 'تهنئة', weight: 3 },
                        { word: 'مبروك', weight: 3 },
                        { word: 'فرح', weight: 3 },
                        { word: 'نجاح', weight: 2 },
                        { word: 'إنجاز', weight: 2 },
                        { word: 'احتفال', weight: 1 }
                    ]
                };

                // حساب الأوزان لكل فئة
                let scores = {};
                for (let category in keywords) {
                    scores[category] = 0;
                    keywords[category].forEach(({ word, weight }) => {
                        if (lowerDesc.includes(word)) {
                            scores[category] += weight;
                        }
                    });
                }

                // اختيار الفئة ذات الوزن الأعلى
                let maxScore = 0;
                let selectedCategory = null;
                for (let category in scores) {
                    if (scores[category] > maxScore) {
                        maxScore = scores[category];
                        selectedCategory = category;
                    }
                }

                // إذا لم يتم العثور على فئة مناسبة (وزن صفر)، إرجاع رسالة
                return maxScore > 0 ? selectedCategory : null;
            }
        })
        .catch(err => console.error('فشل تحميل الردود: ', err));
});
