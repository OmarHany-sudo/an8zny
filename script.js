// تحميل الردود من ملف JSON
let responses = {};
let egyptianResponses = {};
let currentResponseType = '';
let currentResponseIndex = -1;
let lastSituationAnalysis = '';
let currentSuggestions = [];
let useEgyptianDialect = true; // استخدام اللهجة المصرية افتراضيًا
let generatedResponses = {}; // تخزين الردود المولدة

// دالة لتحميل الردود من ملف JSON
async function loadResponses() {
    try {
        // تحميل الردود الفصحى
        const response = await fetch('responses.json');
        if (!response.ok) {
            throw new Error('فشل في تحميل ملف الردود الفصحى');
        }
        responses = await response.json();
        
        // تحميل الردود باللهجة المصرية
        const egyptianResponse = await fetch('responses_egyptian.json');
        if (!egyptianResponse.ok) {
            throw new Error('فشل في تحميل ملف الردود المصرية');
        }
        egyptianResponses = await egyptianResponse.json();
        
        console.log('تم تحميل الردود بنجاح');
    } catch (error) {
        console.error('خطأ في تحميل الردود:', error);
        document.getElementById('response-text').textContent = 'حدث خطأ في تحميل الردود. يرجى تحديث الصفحة.';
    }
}

// دالة للحصول على رد عشوائي من النوع المحدد
function getRandomResponse(type) {
    // اختيار مصدر الردود بناءً على اللهجة المفضلة
    const responseSource = useEgyptianDialect ? egyptianResponses : responses;
    
    if (!responseSource[type] || responseSource[type].length === 0) {
        return 'لا توجد ردود متاحة لهذا النوع من المواقف.';
    }
    
    // تخزين النوع الحالي
    currentResponseType = type;
    
    // اختيار رد عشوائي مختلف عن الرد السابق إذا كان هناك أكثر من رد
    let randomIndex;
    if (responseSource[type].length > 1) {
        do {
            randomIndex = Math.floor(Math.random() * responseSource[type].length);
        } while (randomIndex === currentResponseIndex && responseSource[type].length > 1);
    } else {
        randomIndex = 0;
    }
    
    currentResponseIndex = randomIndex;
    return responseSource[type][randomIndex];
}

// دالة للحصول على رد آخر من نفس النوع
function getAnotherResponse() {
    if (!currentResponseType) {
        return 'يرجى اختيار نوع الموقف أولاً.';
    }
    
    // إذا كان هناك رد مولد سابقًا، نقوم بتوليد رد جديد
    if (lastSituationAnalysis && currentResponseType) {
        if (document.querySelector('.tab-btn.active').getAttribute('data-tab') === 'custom-situation') {
            return generateSmartResponse(lastSituationAnalysis, currentResponseType);
        }
    }
    
    return getRandomResponse(currentResponseType);
}

// دالة لتحليل نص الموقف وإيجاد الرد المناسب
function analyzeSituation(situationText, keywords = '') {
    // حفظ نص الموقف للاستخدام لاحقًا
    lastSituationAnalysis = situationText;
    
    // إذا كان النص فارغًا
    if (!situationText.trim()) {
        return 'يرجى كتابة وصف للموقف للحصول على رد مناسب.';
    }
    
    // تحويل النص والكلمات المفتاحية إلى مصفوفة من الكلمات
    const situationWords = situationText.toLowerCase().split(/\s+/);
    const keywordsArray = keywords ? keywords.toLowerCase().split(/[,،\s]+/) : [];
    
    // دمج الكلمات من النص والكلمات المفتاحية
    const allWords = [...situationWords, ...keywordsArray];
    
    // إنشاء نظام تسجيل نقاط لكل نوع من أنواع الردود
    const scores = {};
    
    // الكلمات المفتاحية لكل نوع من أنواع الردود - تحسين للهجة المصرية
    const keywordMap = {
        'رفض': ['رفض', 'لا', 'مش', 'صعب', 'مستحيل', 'معلش', 'آسف', 'اعتذر', 'طلب', 'مش هينفع', 'مش هقدر', 'صعب عليا', 'مش عارف', 'مش ممكن', 'مش قادر', 'مش فاضي'],
        'احراج': ['احراج', 'محرج', 'خجل', 'صعب', 'موقف', 'حرج', 'كسوف', 'بتكسف', 'متكسف', 'مكسوف', 'حرجان', 'متحرج', 'مش عارف أرد', 'مش عارف أقول'],
        'اعتذار': ['اعتذار', 'آسف', 'سامح', 'غلط', 'خطأ', 'سوء', 'معلش', 'غصب عني', 'مكنش قصدي', 'أنا غلطان', 'سامحني', 'متزعلش', 'مش هتتكرر', 'وعد'],
        'شكر': ['شكر', 'امتنان', 'جميل', 'مساعدة', 'عرفان', 'متشكر', 'ربنا يخليك', 'كتر خيرك', 'مش عارف أشكرك إزاي', 'ألف شكر', 'ممنون', 'مقدر', 'مش هنسى'],
        'تهنئة': ['تهنئة', 'مبروك', 'نجاح', 'فرح', 'سعيد', 'إنجاز', 'ألف مبروك', 'مبروك عليك', 'فرحتلك', 'تستاهل', 'عقبال', 'ربنا يتمم بخير'],
        'مواساة': ['مواساة', 'حزن', 'وفاة', 'فقدان', 'صبر', 'عزاء', 'البقاء لله', 'ربنا يصبرك', 'ربنا يرحمه', 'ربنا يعوضك', 'متزعلش', 'الدنيا كده', 'ربنا موجود'],
        'طلب مساعدة': ['مساعدة', 'محتاج', 'طلب', 'عون', 'دعم', 'ممكن تساعدني', 'محتاج مساعدتك', 'لو سمحت', 'عايز منك', 'تقدر', 'ممكن', 'محتاج خدمة', 'ساعدني'],
        'تقديم مساعدة': ['مساعدة', 'عرض', 'تقديم', 'دعم', 'مستعد', 'أنا موجود', 'تحت أمرك', 'أقدر أساعدك', 'أنا هساعدك', 'عايز أساعد', 'ممكن أساعد', 'أنا جاهز'],
        'تحفيز': ['تحفيز', 'تشجيع', 'دعم', 'قوة', 'إرادة', 'نجاح', 'إنت قدها', 'هتعملها', 'متقلقش', 'هتنجح', 'أنا واثق فيك', 'قدها وقدود', 'هتعدي', 'أقوى'],
        'اقتراح': ['اقتراح', 'فكرة', 'رأي', 'حل', 'تجربة', 'ما رأيك', 'إيه رأيك', 'ممكن نعمل', 'ما تيجي', 'خلينا', 'أنا شايف', 'ممكن نجرب', 'عندي فكرة'],
        'تعزية': ['تعزية', 'وفاة', 'موت', 'فقدان', 'عزاء', 'صبر', 'البقاء لله', 'ربنا يرحمه', 'إنا لله', 'ربنا يصبركم', 'ربنا يغفر له', 'الله يرحمه', 'جنازة', 'عزاء'],
        'عتاب': ['عتاب', 'زعل', 'خذلان', 'لوم', 'عتب', 'زعلان منك', 'مكنتش أتوقع', 'ليه كده', 'إزاي تعمل كده', 'مستغرب', 'مكنتش أتخيل', 'كان نفسي', 'كنت فاكر'],
        'مدح': ['مدح', 'إعجاب', 'رائع', 'ممتاز', 'جميل', 'إنت رائع', 'شغلك حلو', 'تسلم إيدك', 'برافو', 'عاش', 'إنت جامد', 'شاطر', 'متميز', 'موهوب'],
        'نصيحة': ['نصيحة', 'رأي', 'مشورة', 'توجيه', 'إرشاد', 'أنصحك', 'لو سمعت كلامي', 'الأفضل', 'المفروض', 'لازم', 'من الأحسن', 'خليك', 'بلاش', 'حاول'],
        'تشجيع': ['تشجيع', 'دعم', 'حماس', 'قوة', 'استمرار', 'متقلقش', 'إنت هتنجح', 'كمل', 'استمر', 'متيأسش', 'فاضل شوية', 'قرب تخلص', 'أنا معاك'],
        'تهدئة': ['تهدئة', 'هدوء', 'توتر', 'قلق', 'عصبية', 'اهدى', 'خد نفس', 'بلاش عصبية', 'كله هيتحل', 'مفيش مشكلة', 'بسيطة', 'متقلقش', 'ريلاكس', 'كله تمام'],
        'اعتراض': ['اعتراض', 'رفض', 'غير موافق', 'مختلف', 'معارضة', 'مش موافق', 'أنا شايف عكس كده', 'لأ', 'مش صح', 'غلط', 'مش منطقي', 'مش معقول', 'إزاي'],
        'تأجيل': ['تأجيل', 'لاحقًا', 'وقت', 'تأخير', 'انتظار', 'بعدين', 'مش دلوقتي', 'وقت تاني', 'بكرة', 'الأسبوع الجاي', 'لما أفضى', 'مش فاضي دلوقتي', 'مشغول'],
        'تعاطف': ['تعاطف', 'فهم', 'شعور', 'إحساس', 'تفهم', 'أنا حاسس بيك', 'أنا فاهمك', 'أنا عارف', 'صعب', 'مؤلم', 'متضايق', 'حزين', 'أنا معاك'],
        'تحية': ['تحية', 'سلام', 'صباح', 'مساء', 'أهلا', 'إزيك', 'عامل إيه', 'صباح الخير', 'مساء النور', 'هاي', 'أهلاً', 'منور', 'وحشتني'],
        'وداع': ['وداع', 'سلام', 'لقاء', 'مع السلامة', 'تصبح', 'يلا سلام', 'هشوفك بعدين', 'باي', 'تصبح على خير', 'هكلمك بكرة', 'خلينا في تواصل', 'هسيبك'],
        'مقابلة عمل': ['مقابلة', 'عمل', 'وظيفة', 'توظيف', 'مهارات', 'خبرة', 'سيرة ذاتية', 'مرتب', 'راتب', 'شركة', 'مدير', 'موظف', 'مؤهلات'],
        'طلب إجازة': ['إجازة', 'راحة', 'غياب', 'إذن', 'مرض', 'أستأذن', 'محتاج أجازة', 'عايز أرتاح', 'تعبان', 'ظروف', 'مشوار', 'سفر', 'عيان'],
        'مقابلة شخصية': ['مقابلة', 'شخصية', 'تعارف', 'نفسي', 'هواية', 'عن نفسي', 'هوايتي', 'اهتمامات', 'طموح', 'هدف', 'حياة', 'شخصيتي', 'صفاتي'],
        'تقديم عرض': ['عرض', 'تقديم', 'شرح', 'توضيح', 'نتائج', 'بنقدم', 'هنستعرض', 'بنعرض', 'تقديمي', 'بريزنتيشن', 'عرض تقديمي', 'بوربوينت'],
        'تقديم شكوى': ['شكوى', 'مشكلة', 'خدمة', 'سيئة', 'استياء', 'مش راضي', 'عندي مشكلة', 'زعلان من', 'مش عاجبني', 'سيء', 'رديء', 'مش كويس', 'عايز أشتكي'],
        'طلب معلومات': ['معلومات', 'استفسار', 'سؤال', 'بيانات', 'شرح', 'عايز أعرف', 'ممكن تقولي', 'فين', 'إزاي', 'إمتى', 'ليه', 'كام', 'مين', 'إيه'],
        'تقديم اقتراح': ['اقتراح', 'فكرة', 'تطوير', 'تحسين', 'تعديل', 'أنا مقترح', 'إيه رأيك', 'ممكن نعمل', 'لو عملنا', 'أنا شايف', 'ممكن نحسن', 'ممكن نغير'],
        'تقديم عذر': ['عذر', 'اعتذار', 'ظروف', 'منع', 'تأخير', 'مش هقدر', 'ظروف طارئة', 'حصل ظرف', 'مش هعرف', 'معلش', 'آسف', 'مضطر', 'غصب عني'],
        'تهنئة بمناسبة': ['مناسبة', 'عيد', 'احتفال', 'مبروك', 'سعيد', 'كل سنة وانت طيب', 'عيد سعيد', 'رمضان', 'عيد الفطر', 'عيد الأضحى', 'كريسماس', 'السنة الجديدة']
    };
    
    // تحليل اللهجة المصرية في النص
    const egyptianDialectMarkers = ['إزيك', 'عامل إيه', 'إزاي', 'فين', 'إيه', 'ازاي', 'دلوقتي', 'بقى', 'كده', 'عشان', 'مش', 'بس', 'يعني', 'خالص', 'أوي', 'جدا', 'عايز', 'هقول', 'هعمل', 'هروح', 'عندي', 'معايا', 'منك', 'عليك', 'معاك', 'فيه', 'بتاع', 'اللي', 'ده', 'دي'];
    
    // التحقق من وجود مؤشرات اللهجة المصرية
    const hasEgyptianDialect = egyptianDialectMarkers.some(marker => 
        situationText.includes(marker) || keywordsArray.some(keyword => keyword.includes(marker))
    );
    
    // تعيين اللهجة المفضلة بناءً على تحليل النص
    useEgyptianDialect = hasEgyptianDialect || useEgyptianDialect;
    
    // حساب النقاط لكل نوع بناءً على تطابق الكلمات
    for (const word of allWords) {
        for (const [type, keywords] of Object.entries(keywordMap)) {
            if (keywords.some(keyword => word.includes(keyword) || keyword.includes(word))) {
                scores[type] = (scores[type] || 0) + 1;
            }
        }
    }
    
    // تحليل السياق العام للنص - تحسين للهجة المصرية
    if (situationText.includes('لا أستطيع') || situationText.includes('مش قادر') || situationText.includes('صعب علي') || 
        situationText.includes('مش هقدر') || situationText.includes('مش هينفع')) {
        scores['رفض'] = (scores['رفض'] || 0) + 3;
    }
    
    if (situationText.includes('أشكر') || situationText.includes('ممتن') || situationText.includes('جميل') || 
        situationText.includes('متشكر') || situationText.includes('شكرا')) {
        scores['شكر'] = (scores['شكر'] || 0) + 3;
    }
    
    if (situationText.includes('آسف') || situationText.includes('اعتذر') || situationText.includes('غلطت') || 
        situationText.includes('معلش') || situationText.includes('سامحني')) {
        scores['اعتذار'] = (scores['اعتذار'] || 0) + 3;
    }
    
    if (situationText.includes('زعلان') || situationText.includes('مضايق') || situationText.includes('خذلتني') || 
        situationText.includes('مكنتش أتوقع منك') || situationText.includes('ليه عملت كده')) {
        scores['عتاب'] = (scores['عتاب'] || 0) + 3;
    }
    
    if (situationText.includes('ممكن تساعدني') || situationText.includes('محتاج مساعدتك') || 
        situationText.includes('عايز مساعدة') || situationText.includes('تقدر تساعدني')) {
        scores['طلب مساعدة'] = (scores['طلب مساعدة'] || 0) + 3;
    }
    
    if (situationText.includes('أنا موجود') || situationText.includes('تحت أمرك') || 
        situationText.includes('أقدر أساعدك') || situationText.includes('أنا هساعدك')) {
        scores['تقديم مساعدة'] = (scores['تقديم مساعدة'] || 0) + 3;
    }
    
    if (situationText.includes('متقلقش') || situationText.includes('إنت قدها') || 
        situationText.includes('هتعملها') || situationText.includes('أنا واثق فيك')) {
        scores['تحفيز'] = (scores['تحفيز'] || 0) + 3;
    }
    
    if (situationText.includes('اهدى') || situationText.includes('خد نفس') || 
        situationText.includes('بلاش عصبية') || situationText.includes('كله هيتحل')) {
        scores['تهدئة'] = (scores['تهدئة'] || 0) + 3;
    }
    
    // تحليل أنماط الجمل للحصول على فهم أفضل للسياق
    if (situationText.includes('؟') || situationText.includes('ازاي') || situationText.includes('فين') || 
        situationText.includes('ليه') || situationText.includes('إمتى') || situationText.includes('مين')) {
        scores['طلب معلومات'] = (scores['طلب معلومات'] || 0) + 2;
    }
    
    if (situationText.includes('صديقي') || situationText.includes('صاحبي') || situationText.includes('زميلي') || 
        situationText.includes('قريبي') || situationText.includes('جاري')) {
        // زيادة احتمالية أن يكون الموقف اجتماعي
        scores['تعاطف'] = (scores['تعاطف'] || 0) + 1;
        scores['نصيحة'] = (scores['نصيحة'] || 0) + 1;
    }
    
    if (situationText.includes('شغل') || situationText.includes('وظيفة') || situationText.includes('مدير') || 
        situationText.includes('زميل') || situationText.includes('مكتب') || situationText.includes('شركة')) {
        // زيادة احتمالية أن يكون الموقف متعلق بالعمل
        scores['مقابلة عمل'] = (scores['مقابلة عمل'] || 0) + 1;
        scores['طلب إجازة'] = (scores['طلب إجازة'] || 0) + 1;
    }
    
    if (situationText.includes('فلوس') || situationText.includes('قرض') || situationText.includes('فلوسي') || 
        situationText.includes('مال') || situationText.includes('جنيه') || situationText.includes('دين')) {
        // زيادة احتمالية أن يكون الموقف متعلق بالمال
        scores['رفض'] = (scores['رفض'] || 0) + 2;
        scores['طلب مساعدة'] = (scores['طلب مساعدة'] || 0) + 2;
    }
    
    // ترتيب الأنواع حسب النقاط
    const sortedTypes = Object.entries(scores)
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0]);
    
    // حفظ الاقتراحات للاستخدام لاحقًا
    currentSuggestions = sortedTypes.slice(0, 3);
    
    // إذا لم يتم العثور على أي تطابق
    if (sortedTypes.length === 0) {
        return 'مش قادر أفهم الموقف كويس. ممكن توضح أكتر أو تضيف كلمات مفتاحية؟';
    }
    
    // استخدام النوع الأعلى نقاطًا
    currentResponseType = sortedTypes[0];
    
    // استخدام النموذج الذكي لتوليد رد مخصص
    return generateSmartResponse(situationText, currentResponseType);
}

// دالة لتوليد رد ذكي مخصص بناءً على نص الموقف ونوع الرد
function generateSmartResponse(situationText, responseType) {
    // إنشاء مفتاح فريد للموقف
    const situationKey = `${responseType}_${situationText.substring(0, 20)}`;
    
    // التحقق مما إذا كان هناك رد مولد سابقًا لهذا الموقف
    if (generatedResponses[situationKey] && generatedResponses[situationKey].length > 0) {
        // اختيار رد مختلف من الردود المولدة سابقًا
        const previousResponses = generatedResponses[situationKey];
        if (previousResponses.length > 1) {
            let randomIndex;
            do {
                randomIndex = Math.floor(Math.random() * previousResponses.length);
            } while (randomIndex === currentResponseIndex && previousResponses.length > 1);
            
            currentResponseIndex = randomIndex;
            return previousResponses[randomIndex];
        }
        return previousResponses[0];
    }
    
    // استخراج كلمات مهمة من نص الموقف
    const importantWords = extractImportantWords(situationText);
    
    // الحصول على قالب رد من قاعدة البيانات
    const responseSource = useEgyptianDialect ? egyptianResponses : responses;
    const responseTemplates = responseSource[responseType] || [];
    
    if (responseTemplates.length === 0) {
        return 'مش قادر أفهم الموقف كويس. ممكن توضح أكتر؟';
    }
    
    // اختيار قالب رد عشوائي
    const templateIndex = Math.floor(Math.random() * responseTemplates.length);
    let responseTemplate = responseTemplates[templateIndex];
    
    // تخصيص الرد بناءً على الكلمات المهمة والسياق
    let customizedResponse = customizeResponse(responseTemplate, importantWords, responseType, situationText);
    
    // إضافة عبارات إضافية بناءً على نوع الرد
    customizedResponse = addContextualPhrases(customizedResponse, responseType, situationText);
    
    // تخزين الرد المولد للاستخدام لاحقًا
    if (!generatedResponses[situationKey]) {
        generatedResponses[situationKey] = [];
    }
    generatedResponses[situationKey].push(customizedResponse);
    
    return customizedResponse;
}

// دالة لاستخراج الكلمات المهمة من نص الموقف
function extractImportantWords(text) {
    // قائمة بالكلمات غير المهمة (stop words)
    const stopWords = ['في', 'من', 'على', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'ذلك', 'تلك', 'هو', 'هي', 'أنا', 'أنت', 'نحن', 'هم', 'كان', 'كانت', 'يكون', 'تكون', 'سوف', 'قد', 'لا', 'لم', 'لن', 'إن', 'أن', 'كل', 'بعض', 'غير', 'أو', 'ثم', 'حتى', 'إذا', 'عندما', 'كما', 'بينما', 'حيث', 'كيف', 'متى', 'أين', 'لماذا', 'ماذا', 'من', 'الذي', 'التي', 'الذين', 'اللواتي', 'ما', 'يا', 'أيها', 'أيتها'];
    
    // تقسيم النص إلى كلمات
    const words = text.toLowerCase().split(/\s+/);
    
    // فلترة الكلمات المهمة
    const importantWords = words.filter(word => {
        // استبعاد الكلمات القصيرة جدًا والكلمات غير المهمة
        return word.length > 2 && !stopWords.includes(word);
    });
    
    return importantWords;
}

// دالة لتخصيص الرد بناءً على الكلمات المهمة والسياق
function customizeResponse(template, importantWords, responseType, situationText) {
    // نسخة من القالب للتعديل
    let customized = template;
    
    // استبدال الكلمات العامة بكلمات من سياق الموقف
    if (importantWords.length > 0) {
        // استبدال الكلمات العامة مثل "الموضوع ده" أو "الحاجة دي" بكلمات محددة من الموقف
        const genericTerms = ['الموضوع ده', 'الحاجة دي', 'كده', 'هذا الأمر', 'هذا الموقف', 'هذه المسألة'];
        
        for (const term of genericTerms) {
            if (customized.includes(term) && Math.random() > 0.5) {
                // اختيار كلمة مهمة عشوائية
                const randomWord = importantWords[Math.floor(Math.random() * importantWords.length)];
                customized = customized.replace(term, randomWord);
            }
        }
    }
    
    // تخصيص الرد بناءً على نوع الرد
    switch (responseType) {
        case 'رفض':
            if (situationText.includes('فلوس') || situationText.includes('قرض') || situationText.includes('مال')) {
                customized = customized.replace('الطلب ده', 'طلب الفلوس ده')
                                      .replace('مش هقدر دلوقتي', 'مش معايا فلوس دلوقتي');
            } else if (situationText.includes('خروج') || situationText.includes('سهرة') || situationText.includes('فسحة')) {
                customized = customized.replace('الطلب ده', 'الخروجة دي')
                                      .replace('مش هقدر دلوقتي', 'مش هقدر أخرج دلوقتي');
            }
            break;
            
        case 'اعتذار':
            if (situationText.includes('تأخير') || situationText.includes('متأخر')) {
                customized = customized.replace('اللي حصل', 'التأخير ده')
                                      .replace('مكنش قصدي', 'مكنش قصدي أتأخر عليك');
            } else if (situationText.includes('نسيت') || situationText.includes('نسيان')) {
                customized = customized.replace('اللي حصل', 'إني نسيت')
                                      .replace('مكنش قصدي', 'مكنش قصدي أنسى');
            }
            break;
            
        case 'طلب مساعدة':
            if (situationText.includes('مذاكرة') || situationText.includes('امتحان') || situationText.includes('دراسة')) {
                customized = customized.replace('في موضوع مهم', 'في المذاكرة')
                                      .replace('محتاج مساعدتك', 'محتاج مساعدتك في المذاكرة');
            } else if (situationText.includes('شغل') || situationText.includes('وظيفة') || situationText.includes('مشروع')) {
                customized = customized.replace('في موضوع مهم', 'في الشغل')
                                      .replace('محتاج مساعدتك', 'محتاج مساعدتك في المشروع');
            }
            break;
    }
    
    return customized;
}

// دالة لإضافة عبارات سياقية للرد
function addContextualPhrases(response, responseType, situationText) {
    // نسخة من الرد للتعديل
    let enhanced = response;
    
    // إضافة عبارات في بداية أو نهاية الرد بناءً على السياق
    const shouldAddPhrase = Math.random() > 0.3; // 70% احتمالية إضافة عبارة
    
    if (shouldAddPhrase) {
        // عبارات البداية حسب نوع الرد
        const startPhrases = {
            'رفض': ['بص يا صاحبي، ', 'والله يا باشا، ', 'معلش يا غالي، '],
            'اعتذار': ['أنا آسف جدًا، ', 'سامحني بجد، ', 'معلش والله، '],
            'شكر': ['بجد مش عارف أقولك إيه، ', 'ربنا يخليك ليا، ', 'إنت إنسان جميل بجد، '],
            'تهنئة': ['ألف مبروك يا حبيبي، ', 'فرحتلك من قلبي، ', 'يا سلام، '],
            'مواساة': ['ربنا يصبرك يا حبيبي، ', 'البقاء لله، ', 'معلش يا صاحبي، '],
            'طلب مساعدة': ['لو مش هتقل عليك، ', 'معلش يا صاحبي، ', 'محتاج منك خدمة، '],
            'تقديم مساعدة': ['متقلقش خالص، ', 'أنا معاك، ', 'اطمن، '],
            'تحفيز': ['إنت أحسن واحد، ', 'متقلقش، ', 'ثق في نفسك، '],
            'نصيحة': ['من وجهة نظري، ', 'لو تسمحلي أقولك، ', 'نصيحة مني، '],
            'تهدئة': ['خد نفس عميق، ', 'اهدى بس، ', 'بلاش تتعصب، '],
            'تعاطف': ['أنا حاسس بيك، ', 'أنا فاهم إنت حاسس بإيه، ', 'صدقني أنا عارف، ']
        };
        
        // عبارات النهاية حسب نوع الرد
        const endPhrases = {
            'رفض': [' معلش يعني.', ' آسف تاني.', ' أتمنى تتفهم موقفي.'],
            'اعتذار': [' مش هتتكرر تاني.', ' أرجو تسامحني.', ' أنا عارف إني غلطان.'],
            'شكر': [' ربنا يكرمك.', ' بجد مش عارف أشكرك إزاي.', ' إنت صاحب جدع.'],
            'تهنئة': [' تستاهل كل خير.', ' ربنا يسعدك دايمًا.', ' وعقبال فرحة أكبر.'],
            'مواساة': [' ربنا يصبرك.', ' أنا معاك في أي وقت.', ' لو محتاج حاجة أنا موجود.'],
            'طلب مساعدة': [' وهرد الجميل.', ' وأنا تحت أمرك في أي وقت.', ' وهكون شاكر ليك جدًا.'],
            'تقديم مساعدة': [' أنا موجود في أي وقت.', ' متترددش تطلب أي حاجة.', ' دي حاجة بسيطة.'],
            'تحفيز': [' إنت قدها وقدود.', ' أنا واثق فيك.', ' هتعملها وهتنجح.'],
            'نصيحة': [' دي وجهة نظري.', ' وإنت طبعًا حر.', ' وأتمنى تفكر في كلامي.'],
            'تهدئة': [' كله هيبقى تمام.', ' مفيش حاجة تستاهل.', ' خليك كول.'],
            'تعاطف': [' أنا معاك.', ' لو عايز تتكلم أنا موجود.', ' أنا جنبك.']
        };
        
        // اختيار عبارة بداية أو نهاية عشوائية إذا كانت متوفرة لنوع الرد
        if (Math.random() > 0.5 && startPhrases[responseType]) {
            const randomStartPhrase = startPhrases[responseType][Math.floor(Math.random() * startPhrases[responseType].length)];
            enhanced = randomStartPhrase + enhanced.charAt(0).toLowerCase() + enhanced.slice(1);
        } else if (endPhrases[responseType]) {
            const randomEndPhrase = endPhrases[responseType][Math.floor(Math.random() * endPhrases[responseType].length)];
            // التأكد من عدم تكرار نفس العبارة في النهاية
            if (!enhanced.includes(randomEndPhrase.trim())) {
                enhanced = enhanced + randomEndPhrase;
            }
        }
    }
    
    return enhanced;
}

// دالة لعرض التنبيه (Toast)
function showToast() {
    const toast = document.getElementById('toast');
    toast.classList.add('show');
    
    // إخفاء التنبيه بعد 3 ثواني
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// دالة لنسخ النص إلى الحافظة
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast();
    } catch (error) {
        console.error('فشل في نسخ النص:', error);
        
        // طريقة بديلة للنسخ في حالة فشل الطريقة الأولى
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = 0;
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            document.execCommand('copy');
            showToast();
        } catch (err) {
            console.error('فشل في نسخ النص بالطريقة البديلة:', err);
        }
        
        document.body.removeChild(textarea);
    }
}

// تنفيذ الكود عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    // تحميل الردود
    loadResponses();
    
    // الحصول على العناصر
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const situationSelect = document.getElementById('situation-type');
    const getResponseButton = document.getElementById('get-response');
    const analyzeSituationButton = document.getElementById('analyze-situation');
    const situationDescription = document.getElementById('situation-description');
    const situationKeywords = document.getElementById('situation-keywords');
    const responseText = document.getElementById('response-text');
    const copyButton = document.getElementById('copy-response');
    const getAnotherButton = document.getElementById('get-another');
    
    // إضافة مستمع حدث للتبويبات
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // إزالة الفئة النشطة من جميع الأزرار والمحتويات
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // إضافة الفئة النشطة للزر المحدد
            button.classList.add('active');
            
            // إظهار المحتوى المناسب
            const tabId = button.getAttribute('data-tab');
            document.getElementById(`${tabId}-content`).classList.add('active');
            
            // إعادة تعيين نص الرد
            responseText.textContent = 'اختر نوع الموقف أو اشرح موقفك للحصول على رد مناسب...';
            copyButton.disabled = true;
            getAnotherButton.disabled = true;
        });
    });
    
    // إضافة مستمع حدث لزر "احصل على رد"
    getResponseButton.addEventListener('click', () => {
        const selectedType = situationSelect.value;
        
        if (!selectedType) {
            responseText.textContent = 'يرجى اختيار نوع الموقف أولاً.';
            copyButton.disabled = true;
            getAnotherButton.disabled = true;
            return;
        }
        
        const response = getRandomResponse(selectedType);
        responseText.textContent = response;
        copyButton.disabled = false;
        getAnotherButton.disabled = false;
    });
    
    // إضافة مستمع حدث لزر "تحليل الموقف والحصول على رد"
    analyzeSituationButton.addEventListener('click', () => {
        const description = situationDescription.value;
        const keywords = situationKeywords.value;
        
        if (!description.trim()) {
            responseText.textContent = 'يرجى كتابة وصف للموقف للحصول على رد مناسب.';
            copyButton.disabled = true;
            getAnotherButton.disabled = true;
            return;
        }
        
        const response = analyzeSituation(description, keywords);
        responseText.textContent = response;
        copyButton.disabled = false;
        getAnotherButton.disabled = false;
        
        // إضافة معلومات عن التصنيف إذا كان هناك اقتراحات
        if (currentSuggestions.length > 0) {
            console.log('تصنيفات محتملة للموقف:', currentSuggestions.join(', '));
        }
    });
    
    // إضافة مستمع حدث لزر "نسخ الرد"
    copyButton.addEventListener('click', () => {
        copyToClipboard(responseText.textContent);
    });
    
    // إضافة مستمع حدث لزر "رد آخر"
    getAnotherButton.addEventListener('click', () => {
        const activeTab = document.querySelector('.tab-btn.active').getAttribute('data-tab');
        
        if (activeTab === 'quick-responses') {
            // في حالة الردود الجاهزة
            const response = getAnotherResponse();
            responseText.textContent = response;
        } else if (activeTab === 'custom-situation') {
            // في حالة شرح الموقف
            if (lastSituationAnalysis) {
                const response = getAnotherResponse();
                responseText.textContent = response;
            } else {
                responseText.textContent = 'يرجى تحليل الموقف أولاً للحصول على رد.';
            }
        }
    });
    
    // إضافة مستمع حدث لتغيير نوع الموقف
    situationSelect.addEventListener('change', () => {
        responseText.textContent = 'اضغط على "احصل على رد" للحصول على رد مناسب...';
        copyButton.disabled = true;
        getAnotherButton.disabled = true;
    });
    
    // إضافة مستمع حدث لتغيير وصف الموقف
    situationDescription.addEventListener('input', () => {
        responseText.textContent = 'اضغط على "تحليل الموقف والحصول على رد" للحصول على رد مناسب...';
        copyButton.disabled = true;
        getAnotherButton.disabled = true;
        lastSituationAnalysis = '';
    });
});
