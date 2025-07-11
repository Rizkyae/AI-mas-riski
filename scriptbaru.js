// script.js (Lengkap dengan Perbaikan Terakhir)

document.addEventListener('DOMContentLoaded', () => {

    // --- Elemen DOM ---
    const sendButton = document.getElementById('send-btn');
    const userInput = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    const historyList = document.getElementById('history-list');
    const newChatBtn = document.getElementById('new-chat-btn');
    const clearHistoryBtn = document.getElementById('clear-history-btn'); // REFERENSI TOMBOL BARU
    const uploadDocBtn = document.getElementById('upload-doc-btn');
    const uploadImgBtn = document.getElementById('upload-img-btn');
    const imageInput = document.getElementById('image-input');
    const docInput = document.getElementById('doc-input');
    const filePreviewContainer = document.getElementById('file-preview-container');
    const aiModelSelect = document.getElementById('ai-model-select'); // Dapatkan elemen select

    // --- Pengaturan API ---
    // PASTIKAN INI API KEY GEMINI ANDA YANG VALID. JANGAN MEMBAGIKAN KEY INI SECARA PUBLIK.
    const apiKey = 'AIzaSyBco_NWz7SagOZ2YMC7CyFXUMg0e_yajv4'; 
    let currentModel = aiModelSelect.value; // Inisialisasi model dari nilai default select

    // --- State Management ---
    let chats = [];
    let currentChatId = null;
    let attachedFile = null;

    // --- Fungsi Pengelola Riwayat ---
    function loadChats() {
        const savedChats = localStorage.getItem('ai-chat-history');
        if (savedChats) {
            chats = JSON.parse(savedChats);
        }
        // Perbaikan: Jika ada chat yang tersimpan, aktifkan chat terakhir secara default
        if (chats.length > 0) {
            currentChatId = chats[0].id;
        } else {
            startNewChat(); // Jika tidak ada chat, mulai chat baru
        }
    }

    function saveChats() {
        localStorage.setItem('ai-chat-history', JSON.stringify(chats));
    }

    function renderHistory() {
        historyList.innerHTML = '';
        if (chats.length === 0) {
            historyList.innerHTML = '<li><a href="#" class="disabled">Tidak ada riwayat</a></li>';
        } else {
            chats.forEach(chat => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = '#';
                a.innerHTML = `<i class="far fa-comment-dots"></i> ${chat.title}`;
                a.dataset.chatId = chat.id;
                if (chat.id === currentChatId) {
                    a.classList.add('active');
                }
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    currentChatId = chat.id;
                    renderChatBox();
                    renderHistory();
                });
                li.appendChild(a);
                historyList.appendChild(li);
            });
        }
    }

    function renderChatBox() {
        chatBox.innerHTML = '';
        const currentChat = chats.find(c => c.id === currentChatId);
        // Tambahkan pesan pembuka hanya jika chatbox kosong
        if (!currentChat || currentChat.messages.length === 0) {
             const initialMessageRow = document.createElement('div');
             initialMessageRow.classList.add('message-row', 'bot');

             const initialAvatar = document.createElement('img');
             initialAvatar.src = 'anim.gif';
             initialAvatar.alt = 'AI Avatar';
             initialAvatar.classList.add('avatar');
             initialMessageRow.appendChild(initialAvatar);

             const initialChatMessage = document.createElement('div');
             initialChatMessage.classList.add('chat-message', 'bot');
             initialChatMessage.innerHTML = '<p>Halo! Saya Mas Riski. Anda bisa bertanya atau mengirimkan file kepada saya.</p>';
             initialMessageRow.appendChild(initialChatMessage);
             chatBox.appendChild(initialMessageRow);
        }

        if (currentChat && currentChat.messages) {
            currentChat.messages.forEach(msg => {
                // Pastikan pesan yang dirender sudah diproses link YouTubenya
                addMessageToDOM(msg.content, msg.sender, msg.type, msg.filePreview, msg.fileObject);
            });
        }
    }

    function startNewChat() {
        const newChatId = `chat-${Date.now()}`;
        const newChat = {
            id: newChatId,
            title: 'Chat Baru', // Judul awal, akan diperbarui saat pesan pertama
            messages: []
        };
        chats.unshift(newChat); // Tambahkan ke awal array
        currentChatId = newChatId;
        userInput.value = '';
        clearFilePreview();
        renderChatBox(); // Render ulang chatbox untuk chat baru
        renderHistory(); // Render ulang riwayat
        saveChats();
    }

    function addMessageToData(content, sender, type = 'text', filePreview = null, fileObject = null) {
        let currentChat = chats.find(c => c.id === currentChatId);
        if (!currentChat) {
            startNewChat();
            currentChat = chats.find(c => c.id === currentChatId);
        }
        currentChat.messages.push({
            sender,
            content,
            type,
            filePreview,
            fileObject
        });

        // Perbarui judul chat jika ini pesan pertama di chat baru
        if (currentChat.messages.length === 1) {
            currentChat.title = content ? (content.substring(0, 30) + (content.length > 30 ? '...' : '')) : (fileObject ? `File: ${fileObject.name.substring(0, 20)}...` : 'Chat Baru');
            renderHistory(); // Render ulang riwayat untuk memperbarui judul
        }
        saveChats();
    }

    function clearFilePreview() {
        attachedFile = null;
        filePreviewContainer.innerHTML = '';
    }

    function renderFilePreview(fileData) {
        clearFilePreview();
        attachedFile = fileData;
        const previewWrapper = document.createElement('div');
        previewWrapper.className = 'file-preview-item';
        if (fileData.mimeType.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = `data:${fileData.mimeType};base64,${fileData.base64}`;
            previewWrapper.appendChild(img);
        } else {
            previewWrapper.innerHTML = `<i class="fas fa-file-alt" style="font-size: 40px; color: #888;"></i><p style="margin:0 10px;">${fileData.name}</p>`;
        }
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-file-btn';
        removeBtn.innerHTML = '×';
        removeBtn.onclick = clearFilePreview;
        previewWrapper.appendChild(removeBtn);
        filePreviewContainer.appendChild(previewWrapper);
    }

    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert("Ukuran file terlalu besar! Maksimal 5MB.");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result.split(',')[1];
            renderFilePreview({
                name: file.name,
                mimeType: file.type,
                base64: base64String
            });
        };
        reader.readAsDataURL(file);
        event.target.value = '';
    }

    // --- FUNGSI BARU DAN FUNGSI YANG DIPERBARUI ---

    // --- PENGATURAN API KEY YOUTUBE ---
    // GANTI INI DENGAN API KEY YOUTUBE ANDA YANG VALID
    const youtubeApiKey = 'AIzaSyC6Fl1VhgNkqlPr3nN17XRBzFv6ZHptiBw'; 

    // Fungsi untuk mendapatkan detail video dari YouTube Data API
    async function getYouTubeVideoDetails(videoId) {
        try {
            const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${youtubeApiKey}`);
            if (!response.ok) {
                const errorData = await response.json();
                console.error("YouTube API Error Response:", errorData);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.items && data.items.length > 0) {
                const snippet = data.items[0].snippet;
                return {
                    title: snippet.title,
                    description: snippet.description,
                    tags: snippet.tags // Array of tags, can be useful
                };
            }
            return null;
        } catch (error) {
            console.error("Error fetching YouTube video details:", error);
            // Kembali ke null untuk kasus gagal agar tidak ada info yang salah ke AI
            return null;
        }
    }

    // Fungsi embedYouTubeLinks diperbaiki dengan URL embed yang standar
    function embedYouTubeLinks(text) {
        // Regex untuk menangkap ID video dari berbagai format URL YouTube
        const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]{11})(?:\S+)?/g;
        return text.replace(youtubeRegex, (match, videoId) => {
            // Menggunakan format URL embed YouTube yang benar
            // Protokol HTTPS sangat disarankan
            return `<div class="youtube-embed-wrapper"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
        });
    }

    /**
     * FUNGSI DIPERBAIKI: `addMessageToDOM` sekarang sudah benar.
     */
    function addMessageToDOM(message, sender, type = 'text', filePreviewUrl = null, fileObject = null) {
        const messageRow = document.createElement('div');
        messageRow.classList.add('message-row', sender);

        // Menambahkan avatar untuk BOT atau USER
        const avatar = document.createElement('img');
        if (sender === 'bot') {
            avatar.src = 'anim.gif'; // Avatar untuk AI
            avatar.alt = 'AI Avatar';
        } else {
            avatar.src = 'user.gif'; // GANTI dengan path ke gambar avatar pengguna Anda
            avatar.alt = 'User Avatar';
        }
        avatar.classList.add('avatar');
        messageRow.appendChild(avatar);

        const chatMessage = document.createElement('div');
        chatMessage.classList.add('chat-message', sender);

        let contentHTML = '';

        // Logika baru untuk menampilkan pratinjau file
        if (filePreviewUrl) {
            let isImage = false;
            // Cek tipe file jika informasi file lengkap tersedia (saat baru dikirim)
            if (fileObject) {
                isImage = fileObject.mimeType.startsWith('image/');
                // Jika tidak, tebak dari URL (saat memuat dari riwayat)
            } else {
                isImage = filePreviewUrl.startsWith('data:image/');
            }

            if (isImage) {
                // Jika file adalah gambar, tampilkan gambar
                contentHTML += `<div class="sent-file-preview"><img src="${filePreviewUrl}" alt="Pratinjau Gambar"></div>`;
            } else {
                // Jika bukan gambar, tampilkan ikon dan nama file
                const fileName = fileObject ? fileObject.name : 'Dokumen';
                contentHTML += `<div class="sent-file-preview-doc"><i class="fas fa-file-alt"></i><span>${fileName}</span></div>`;
            }
        }

        // Menambahkan teks pesan
        if (message) {
            // Pastikan embedYouTubeLinks dipanggil di sini agar URL diubah menjadi iframe
            const processedMessage = embedYouTubeLinks(message);
            contentHTML += marked.parse(processedMessage);
        }

        chatMessage.innerHTML = contentHTML;

        messageRow.appendChild(chatMessage);

        chatBox.appendChild(messageRow);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // Fungsi getAIResponse diperbarui untuk menggunakan currentModel dan riwayat percakapan
    async function getAIResponse(conversationParts) { 
        let modelToUse;
        // PENTING: Map nilai dari dropdown ke nama model Gemini API yang sebenarnya.
        if (currentModel === 'gen-z') {
            modelToUse = 'gemini-2.5-flash'; // Untuk persona Gen Z, gunakan model gemini-pro
            console.log("Menggunakan model untuk Gen Z:", modelToUse);
        } else if (currentModel === 'normal') {
            modelToUse = 'gemini-1.5-flash'; // Untuk persona Normal, gunakan model gemini-1.5-flash
            console.log("Menggunakan model untuk Normal AI:", modelToUse);
        } else {
            modelToUse = 'gemini-pro'; // Default fallback jika ada nilai currentModel lain
            console.log("Menggunakan model default:", modelToUse);
        }

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "contents": conversationParts 
                })
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.error("API Error Response:", errorData);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.candidates && data.candidates.length > 0) {
                if (data.candidates[0].content.parts[0].text) {
                    return data.candidates[0].content.parts[0].text.trim();
                }
            }
            return "Maaf, saya tidak dapat memberikan respons yang valid.";
        } catch (error) {
            console.error("Error fetching AI response:", error);
            return "Waduh, sorry banget bro. Gagal nyambung nih, coba ganti model AI";
        }
    }

    async function handleSend() {
        const userMessage = userInput.value.trim();
        if (userMessage === '' && !attachedFile) return;

        // Pastikan ada currentChatId, jika tidak, buat yang baru
        if (currentChatId === null) {
            startNewChat();
        }
        
        const filePreviewForDOM = attachedFile ? `data:${attachedFile.mimeType};base64,${attachedFile.base64}` : null;
        addMessageToDOM(userMessage, 'user', 'text', filePreviewForDOM, attachedFile);
        addMessageToData(userMessage, 'user', 'text', filePreviewForDOM, attachedFile);

        userInput.value = '';
        clearFilePreview();

        // Tambahkan pesan "lagi mikir bentar..."
        addMessageToDOM("lagi mikir bentar...", 'bot');

        // --- Persiapan Riwayat Percakapan untuk API ---
        const currentChat = chats.find(c => c.id === currentChatId);
        const conversationHistoryForAPI = [];

        // --- Logika untuk Persona Prompt berdasarkan currentModel ---
        let personaPrompt = '';
        console.log("Current Model Selected:", currentModel); // Tambahkan log ini
        if (currentModel === 'gen-z') {
            personaPrompt = `React as Riski, your AI bestie. Your personality is super chill, helpful, and you talk like a true Gen Z from Indonesia. Use casual Indonesian and mix in English slang (e.g., 'literally', 'spill', 'no cap', 'YGY', 'bestie'). Use emojis. Always keep the previous conversation in mind.`;
        } else if (currentModel === 'normal') {
            personaPrompt = `You are Mas Riski, a helpful and friendly AI assistant. Respond in clear, concise, and polite Indonesian. Be polite, formal where appropriate, and do not use slang or emojis unless explicitly asked. Always keep the previous conversation in mind.`; // Prompt Normal yang lebih kuat
        }
        console.log("Persona Prompt Generated:", personaPrompt); // Tambahkan log ini
        
        // Tambahkan persona prompt sebagai giliran 'user' pertama
        if (personaPrompt) {
            conversationHistoryForAPI.push({
                "role": "user",
                "parts": [{ "text": personaPrompt }]
            });
        }

        // Iterasi melalui pesan-pesan yang ada di currentChat
        const MAX_HISTORY_MESSAGES = 10; // Contoh: kirim 10 pesan terakhir
        const messagesToSend = currentChat && currentChat.messages ? currentChat.messages.slice(-MAX_HISTORY_MESSAGES) : [];

        for (const msg of messagesToSend) { // Gunakan for...of untuk async/await
            const contentParts = [];
            let processedText = msg.content; 

            // Cek jika pesan mengandung link YouTube
            const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]{11})(?:\S+)?/g;
            const matches = [...(msg.content || '').matchAll(youtubeRegex)]; 

            if (matches.length > 0) {
                for (const match of matches) {
                    const videoId = match[1];
                    const videoDetails = await getYouTubeVideoDetails(videoId); 
                    if (videoDetails) {
                        processedText = (processedText || '') + `\n\n[INFO VIDEO YOUTUBE: Judul: "${videoDetails.title}", Deskripsi: "${videoDetails.description ? videoDetails.description.substring(0, Math.min(videoDetails.description.length, 100)) + '...' : 'Tidak ada deskripsi.'}"]`;
                    }
                }
            }

            if (processedText) {
                contentParts.push({ "text": processedText });
            }
            if (msg.fileObject) {
                contentParts.push({
                    "inline_data": {
                        "mime_type": msg.fileObject.mimeType,
                        "data": msg.fileObject.base64
                    }
                });
            }
            
            // Hanya tambahkan jika ada konten atau file
            if (contentParts.length > 0) {
                conversationHistoryForAPI.push({
                    "role": msg.sender === 'user' ? "user" : "model", // Sesuaikan role
                    "parts": contentParts
                });
            }
        }
        // --- Akhir Persiapan Riwayat Percakapan ---

        const aiMessage = await getAIResponse(conversationHistoryForAPI);

        // Hapus pesan "lagi mikir bentar..."
        if (chatBox.lastChild && chatBox.lastChild.querySelector('.chat-message') && chatBox.lastChild.querySelector('.chat-message').textContent === "lagi mikir bentar...") {
            chatBox.removeChild(chatBox.lastChild);
        }
        
        // Cek lagi untuk kasus "edit foto" atau "ganti background" setelah mendapatkan respons AI
        if (userMessage.toLowerCase().includes('edit foto') || userMessage.toLowerCase().includes('ganti background')) {
             addMessageToDOM("Wah bestie, aku belum bisa bantu edit-edit foto gitu. Aku cuma bisa bantuin ngobrol, kasih info, atau analisis gambar/dokumen aja. Kalau mau edit foto, coba pake aplikasi editing foto khusus ya! 🙏", 'bot');
             addMessageToData("Wah bestie, aku belum bisa bantu edit-edit foto gitu. Aku cuma bisa bantuin ngobrol, kasih info, atau analisis gambar/dokumen aja. Kalau mau edit foto, coba pake aplikasi editing foto khusus ya! 🙏", 'bot');
             return; 
        }

        addMessageToDOM(aiMessage, 'bot');
        addMessageToData(aiMessage, 'bot');
    }

    // --- Event Listeners ---
    sendButton.addEventListener('click', handleSend);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });
    newChatBtn.addEventListener('click', startNewChat);
    uploadDocBtn.addEventListener('click', () => docInput.click());
    uploadImgBtn.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', handleFileSelect);
    docInput.addEventListener('change', handleFileSelect);

    // Event listener untuk hapus riwayat
    clearHistoryBtn.addEventListener('click', () => {
        if (confirm("Yakin mau hapus semua riwayat obrolanmu? Ini bakal permanen lho!")) {
            chats = []; // Kosongkan array chat
            localStorage.removeItem('ai-chat-history'); // Hapus dari local storage
            currentChatId = null; // Reset ID chat saat ini
            startNewChat(); // Mulai chat baru yang bersih
            console.log("Riwayat obrolan telah dihapus!");
        }
    });

    // Event listener untuk perubahan pilihan model AI
    aiModelSelect.addEventListener('change', (e) => {
        currentModel = e.target.value; // Update model yang dipilih
        console.log(`Model AI diubah menjadi: ${currentModel}`);
        // Anda mungkin ingin memberi tahu pengguna bahwa model telah diubah
        // PENTING: Untuk memastikan persona baru diterapkan dengan baik,
        // disarankan untuk memulai chat baru setelah mengganti model.
    });

    // --- Inisialisasi Aplikasi ---
    loadChats();
    renderHistory();
    renderChatBox(); // Pastikan ini dipanggil setelah loadChats
});
