// 初始化 Supabase
const supabaseUrl = 'https://gkhrdkgwttlntcokytas.supabase.co'; // 替换成你的 URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdraHJka2d3dHRsbnRjb2t5dGFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwMjY2NDMsImV4cCI6MjA1NDYwMjY0M30.oE5eGbbaLZlVAPkzdROvJ2glhwxG-JkHvKaO9rzXKI4'; // 替换成你的 Anon Key
const supabase = Supabase.createClient(supabaseUrl, supabaseKey);

document.getElementById('dreamForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const age = document.getElementById('age').value;
    let dreamJob = document.getElementById('dreamJob').value;
    const customJob = document.getElementById('customJob').value;
    const photo = document.getElementById('photo').files[0];
    
    if (customJob) dreamJob = customJob;
    if (!photo || !dreamJob) return;
    
    // 上传照片到 Supabase
    const fileName = `${Date.now()}-${photo.name}`;
    const { data, error } = await supabase.storage
        .from('user-uploads')
        .upload(fileName, photo);
    
    if (error) {
        console.error('Upload failed:', error);
        return;
    }
    
    // 获取公开 URL
    const { publicUrl } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(fileName).data;
    
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, 300, 200);
        
        let jobStyle = {};
        switch (dreamJob.toLowerCase()) {
            case 'astronaut': jobStyle = { color: 'gray', text: 'Space Explorer' }; break;
            case 'doctor': jobStyle = { color: '#87CEEB', text: 'Healing Expert' }; break;
            case 'singer': jobStyle = { color: 'purple', text: 'Music Star' }; break;
            case 'programmer': jobStyle = { color: '#333', text: 'Code Master' }; break;
            case 'soldier': jobStyle = { color: 'green', text: 'Brave Defender' }; break;
            case 'teacher': jobStyle = { color: 'brown', text: 'Knowledge Guide' }; break;
            case 'chef': jobStyle = { color: 'orange', text: 'Culinary Artist' }; break;
            default: jobStyle = { color: '#666', text: 'Dream Chaser' };
        }
        
        ctx.fillStyle = jobStyle.color;
        ctx.fillRect(0, 200, 300, 200);
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText(`${jobStyle.text} (Age: ${age})`, 10, 250);
        
        document.getElementById('result').style.display = 'block';
    };
    
    img.src = publicUrl; // 用 Supabase 的 URL 加载图片
});

document.getElementById('download').addEventListener('click', function() {
    const canvas = document.getElementById('canvas');
    const link = document.createElement('a');
    link.download = 'dream_job_avatar.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
});
