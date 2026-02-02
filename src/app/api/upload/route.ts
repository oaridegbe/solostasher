import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('file') as File[];
    
    const uploadedUrls: {url: string, name: string}[] = [];
    
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const uniqueName = `${uuidv4()}-${file.name.replace(/\s/g, '_')}`;
      const filePath = join(uploadDir, uniqueName);
      
      await writeFile(filePath, buffer);
      
      uploadedUrls.push({
        url: `/uploads/${uniqueName}`,
        name: file.name
      });
    }
    
    return NextResponse.json(uploadedUrls);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}