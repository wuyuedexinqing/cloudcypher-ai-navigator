document.getElementById('dreamForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const age = document.getElementById('age').value;
    let dreamJob = document.getElementById('dreamJob').value;
    const customJob = document.getElementById('customJob').value;
    const photo = document.getElementById('photo').files[0];
    
    // 如果用户填了自定义职业，用它替代下拉框
    if (customJob) dreamJob = customJob;
    if (!photo || !dreamJob) return;
    
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, 300, 200); // 用户照片在上半部分
        
        // 职业模板（简单颜色和文字，后期加图片）
        let jobStyle = {};
        switch (dreamJob.toLowerCase()) {
            case 'astronaut': jobStyle = { color: 'gray', text: 'Space Explorer' }; break;
            case 'doctor': jobStyle = { color: '#87CEEB', text: 'Healing Expert' }; break;
            case 'singer': jobStyle = { color: 'purple', text: 'Music Star' }; break;
            case 'programmer': jobStyle = { color: '#333', text: 'Code Master' }; break;
            case 'soldier': jobStyle = { color: 'green', text: 'Brave Defender' }; break;
            case 'teacher': jobStyle = { color: 'brown', text: 'Knowledge Guide' }; break;
            case 'chef': jobStyle = { color: 'orange', text: 'Culinary Artist' }; break;
            default: jobStyle = { color: '#666', text: 'Dream Chaser' }; // 自定义职业默认
        }
        
        ctx.fillStyle = jobStyle.color;
        ctx.fillRect(0, 200, 300, 200);
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText(`${jobStyle.text} (Age: ${age})`, 10, 250);
        
        document.getElementById('result').style.display = 'block';
    };
    
    img.src = URL.createObjectURL(photo);
});

document.getElementById('download').addEventListener('click', function() {
    const canvas = document.getElementById('canvas');
    const link = document.createElement('a');
    link.download = 'dream_job_avatar.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
});
