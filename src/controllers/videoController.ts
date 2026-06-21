import { Request, Response } from "express";
import { Video } from "../models/videos";

//add video
export const addShortVideo = async (req: Request, res: Response) => {
  try {
    const video = await Video.create(req.body);
    res.status(201).json({ message: "Driving short tutorial added..!", data: video });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: "Fail to create video card", error: err.message });
  }
};

//get all video
export const getAllShortVideos = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 6; 
  const skip = (page - 1) * limit;

  try {
    const videos = await Video.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalDataCount = await Video.countDocuments();

    res.status(200).json({
      message: "Driving tutorial clips data",
      data: videos,
      totalPage: Math.ceil(totalDataCount / limit),
      totalDataCount,
      page
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch driving short videos", error: err.message });
  }
};


export const getSingleVideo = async (req: Request, res: Response) => {
  const { id } = req.params; 
  try {
    const video = await Video.findById(id);

    if (!video) {
      return res.status(404).json({ message: "Video clip not found" });
    }

    res.status(200).json({ message: "Video clip retrieved successfully!", data: video });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch video details", error: err.message });
  }
};

//update video
export const updateShortVideo = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const updatedVideo = await Video.findByIdAndUpdate(
      id, 
      req.body, 
      { new: true, runValidators: true } 
    );

    if (!updatedVideo) {
      return res.status(404).json({ message: "Video clip not found" });
    }

    res.status(200).json({ message: "Driving tutorial updated successfully!", data: updatedVideo });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: "Failed to update video details", error: err.message });
  }
};

//delete video
export const deleteShortVideo = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const deletedVideo = await Video.findByIdAndDelete(id);

    if (!deletedVideo) {
      return res.status(404).json({ message: "Video clip not found" });
    }

    res.status(200).json({ message: "Driving tutorial deleted successfully!" });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete video clip", error: err.message });
  }
};