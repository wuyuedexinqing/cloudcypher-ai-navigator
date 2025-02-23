document.getElementById('dreamForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const age = document.getElementById('age').value;
    const dreamJob = document.getElementById('dreamJob').value;
    const photo = document.getElementById('photo').files[0];
    
    if (!photo) return;
    
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 画用户照片（简单缩放到顶部）
        ctx.drawImage(img, 0, 0, 300, 200);
        
        // 根据职业画模板（这里先用简单矩形代替）
        ctx.fillStyle = dreamJob === 'astronaut' ? 'gray' : 'blue';
        ctx.fillRect(0, 200, 300, 200);
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText(`Age: ${age} - ${dreamJob}`, 10, 250);
        
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
