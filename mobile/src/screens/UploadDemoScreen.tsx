import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/lib/theme';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const API_BASE_URL =
  (process.env as Record<string, string | undefined>).EXPO_PUBLIC_API_URL ||
  'https://your-app-url.replit.dev';

type UploadTarget = 'profile' | 'banner' | 'general';

export function UploadDemoScreen() {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState<string>('');
  const [contestBanner, setContestBanner] = useState<string>('');
  const [generalPreview, setGeneralPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const pickAndUpload = async (target: UploadTarget) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: target === 'general' ? '*/*' : 'image/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const file = result.assets[0];
      const formData = new FormData();
      formData.append(
        'file',
        {
          uri: file.uri,
          name: file.name || `upload-${Date.now()}`,
          type: file.mimeType || 'application/octet-stream',
        } as any
      );

      setIsUploading(true);

      const token = await SecureStore.getItemAsync('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || error.message || 'Upload failed');
      }

      const data = await response.json();
      const fileUrl = data.url;

      if (target === 'profile') setProfileImage(fileUrl);
      if (target === 'banner') setContestBanner(fileUrl);
      if (target === 'general') setGeneralPreview(fileUrl);
      setUploadedFiles((prev) => [...prev, fileUrl]);
      Alert.alert('Upload Complete', 'File uploaded successfully');
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message || 'Unable to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const clearAll = () => {
    setUploadedFiles([]);
    setProfileImage('');
    setContestBanner('');
  };

  const renderUploadCard = (
    title: string,
    icon: keyof typeof Ionicons.glyphMap,
    description: string,
    target: UploadTarget,
    preview?: string
  ) => (
    <Card style={styles.card}>
      <CardHeader>
        <View style={styles.cardTitleRow}>
          <Ionicons name={icon} size={20} color={colors.primary} />
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
      </CardHeader>
      <CardContent>
        {preview ? (
          /\.(jpg|jpeg|png|gif|webp)$/i.test(preview) ? (
            <Image
              source={{ uri: preview }}
              style={target === 'profile' ? styles.profilePreview : styles.bannerPreview}
            />
          ) : (
            <View style={styles.filePlaceholder}>
              <Ionicons name="document-text-outline" size={28} color={colors.textSecondary} />
              <Text style={styles.filePath} numberOfLines={1}>
                {preview.split('/').pop()}
              </Text>
            </View>
          )
        ) : target === 'profile' ? (
          <View style={styles.profilePlaceholder}>
            <Ionicons name="person-circle-outline" size={48} color={colors.textSecondary} />
          </View>
        ) : null}

        <Text style={styles.cardDescription}>{description}</Text>
        <Button
          title={isUploading ? 'Uploading...' : 'Upload File'}
          onPress={() => pickAndUpload(target)}
          disabled={isUploading}
          fullWidth
          size="md"
          style={styles.uploadButton}
        />
      </CardContent>
    </Card>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>File Upload Demo</Text>
          <Text style={styles.subtitle}>Test the local file upload system for your contest platform</Text>
        </View>
        {uploadedFiles.length > 0 && (
          <Button title="Clear All" onPress={clearAll} variant="secondary" size="sm" />
        )}
      </View>

      <View style={styles.grid}>
        {renderUploadCard(
          'Profile Image Upload',
          'person-circle-outline',
          'Upload a profile picture (images only, max ~5MB recommended).',
          'profile',
          profileImage
        )}
        {renderUploadCard(
          'Contest Banner Upload',
          'images-outline',
          'Upload a contest banner (images only, max ~15MB recommended).',
          'banner',
          contestBanner
        )}
        {renderUploadCard(
          'General File Upload',
          'cloud-upload-outline',
          'Upload any file type up to 25MB.',
          'general',
          generalPreview
        )}
      </View>

      <Card style={styles.card}>
        <CardHeader>
          <View style={styles.cardTitleRow}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>About This Upload Demo</Text>
          </View>
        </CardHeader>
        <CardContent>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>What is this page?</Text>
            <Text style={styles.infoText}>
              This is a testing and development page to verify uploads. Files are sent to the same /api/upload endpoint
              used in the web app.
            </Text>
          </View>
          <View style={styles.infoGrid}>
            <View style={styles.infoTile}>
              <Text style={styles.infoTileTitle}>Storage</Text>
              <Text style={styles.infoTileText}>Local dev stores in uploads/; production uses configured storage.</Text>
            </View>
            <View style={styles.infoTile}>
              <Text style={styles.infoTileTitle}>Supported Formats</Text>
              <Text style={styles.infoTileText}>Images, documents, videos, and more.</Text>
            </View>
            <View style={styles.infoTile}>
              <Text style={styles.infoTileTitle}>Max File Size</Text>
              <Text style={styles.infoTileText}>Up to 25MB per file.</Text>
            </View>
            <View style={styles.infoTile}>
              <Text style={styles.infoTileTitle}>Uploads This Session</Text>
              <Text style={styles.infoTileCount}>{uploadedFiles.length}</Text>
            </View>
          </View>
        </CardContent>
      </Card>

      {uploadedFiles.length > 0 && (
        <Card style={styles.card}>
          <CardHeader>
            <View style={styles.cardTitleRow}>
              <Ionicons name="download-outline" size={20} color={colors.primary} />
              <Text style={styles.cardTitle}>Uploaded Files ({uploadedFiles.length})</Text>
            </View>
          </CardHeader>
          <CardContent>
            <View style={styles.filesGrid}>
              {uploadedFiles.map((fileUrl, index) => {
                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl);
                return (
                  <View key={fileUrl + index} style={styles.fileTile}>
                    {isImage ? (
                      <Image source={{ uri: fileUrl }} style={styles.fileImage} />
                    ) : (
                      <View style={styles.filePlaceholder}>
                        <Ionicons name="document-text-outline" size={28} color={colors.textSecondary} />
                      </View>
                    )}
                    <Text style={styles.fileLabel}>File {index + 1}</Text>
                    <Text style={styles.filePath} numberOfLines={1}>
                      {fileUrl}
                    </Text>
                  </View>
                );
              })}
            </View>
          </CardContent>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  grid: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  cardDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  uploadButton: {
    marginTop: spacing.md,
  },
  profilePreview: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.full,
    marginBottom: spacing.sm,
  },
  profilePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  bannerPreview: {
    width: '100%',
    height: 120,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  infoBox: {
    backgroundColor: colors.primary + '10',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  infoTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  infoTile: {
    flexBasis: '48%',
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  infoTileTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  infoTileText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  infoTileCount: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  filesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  fileTile: {
    width: '48%',
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  fileImage: {
    width: '100%',
    height: 80,
    borderRadius: borderRadius.sm,
  },
  filePlaceholder: {
    width: '100%',
    height: 80,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.xs,
  },
  filePath: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
});
