import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import devLogger from '~/common/utils/dev-logger';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});



export async function DELETE(request: NextRequest) {
  try {
    // Get file public_id from request body
    const { public_id } = await request.json();

    if (!public_id) {
      return NextResponse.json(
        { error: 'No public_id provided' },
        { status: 400 }
      );
    }

    // Delete the file from Cloudinary using the public_id
    const result = await cloudinary.uploader.destroy(public_id);

    return NextResponse.json(result);
  } catch (error) {
    devLogger.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Delete failed' },
      { status: 500 }
    );
  }
}
